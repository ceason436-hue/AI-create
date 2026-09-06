export type ToolStorageIdentity = "ANONYMOUS" | "SCHOOL_SHARED" | "PERSONAL";
export type ToolStorageScope = "EPHEMERAL" | "DRAFT";

export const CLASSROOM_STORAGE_TTL_MS = 12 * 60 * 60 * 1_000;

type Clock = () => number;

type StorageEnvelope<T> = {
  version: 1;
  createdAt: number;
  expiresAt: number;
  value: T;
};

export type ToolStorageOptions = {
  identity: ToolStorageIdentity;
  namespace: string;
  scope: ToolStorageScope;
  ttlMs: number;
  sessionStorage?: Storage;
  localStorage?: Storage;
  memoryStorage?: Storage;
  now?: Clock;
};

export type LegacyMigrationOptions<T> = {
  source: Storage;
  sourceKey: string;
  targetKey: string;
  decode?: (raw: string) => T;
  removeSource?: boolean;
};

export type LegacyMigrationResult = "missing" | "migrated" | "invalid" | "failed";

export type ToolStorage = {
  readonly identity: ToolStorageIdentity;
  readonly scope: ToolStorageScope;
  readonly persistence: "memory" | "session" | "local";
  readonly cloudIsSourceOfTruth: boolean;
  get<T>(key: string): T | null;
  set<T>(key: string, value: T): void;
  remove(key: string): void;
  clear(): void;
  migrate<T>(options: LegacyMigrationOptions<T>): LegacyMigrationResult;
};

class MemoryStorage implements Storage {
  private readonly values = new Map<string, string>();

  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, String(value)); }
}

export function createMemoryStorage(): Storage {
  return new MemoryStorage();
}

function validSegment(value: string, label: string) {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 120) throw new Error(`${label} must be between 1 and 120 characters.`);
  return encodeURIComponent(trimmed);
}

function browserStorage(kind: "localStorage" | "sessionStorage") {
  if (typeof window === "undefined") return undefined;
  try {
    return window[kind];
  } catch {
    return undefined;
  }
}

function isEnvelope(value: unknown): value is StorageEnvelope<unknown> {
  if (!value || typeof value !== "object") return false;
  const envelope = value as Record<string, unknown>;
  return envelope.version === 1 &&
    typeof envelope.createdAt === "number" &&
    typeof envelope.expiresAt === "number" &&
    Object.hasOwn(envelope, "value");
}

function keysWithPrefix(storage: Storage, prefix: string) {
  const keys: string[] = [];
  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);
    if (key?.startsWith(prefix)) keys.push(key);
  }
  return keys;
}

export function createToolStorage(options: ToolStorageOptions): ToolStorage {
  const namespace = validSegment(options.namespace, "namespace");
  if (!Number.isFinite(options.ttlMs) || options.ttlMs <= 0) throw new Error("ttlMs must be a positive number.");
  if (options.identity !== "PERSONAL" && options.scope !== "EPHEMERAL") {
    throw new Error(`${options.identity} storage cannot use a persistent draft cache.`);
  }

  const memory = options.memoryStorage ?? createMemoryStorage();
  const session = options.sessionStorage ?? browserStorage("sessionStorage");
  const local = options.localStorage ?? browserStorage("localStorage");
  let storage = memory;
  let persistence: ToolStorage["persistence"] = "memory";

  if (options.identity === "PERSONAL" && options.scope === "DRAFT" && local) {
    storage = local;
    persistence = "local";
  } else if (session) {
    storage = session;
    persistence = "session";
  }

  // A school workspace can never extend beyond the confirmed 12-hour classroom boundary.
  const ttlMs = options.identity === "SCHOOL_SHARED"
    ? Math.min(options.ttlMs, CLASSROOM_STORAGE_TTL_MS)
    : options.ttlMs;
  const now = options.now ?? Date.now;
  const prefix = `krt:tool-storage:v1:${options.identity}:${options.scope}:${namespace}:`;
  const storageKey = (key: string) => `${prefix}${validSegment(key, "key")}`;

  const adapter: ToolStorage = {
    identity: options.identity,
    scope: options.scope,
    persistence,
    cloudIsSourceOfTruth: options.identity === "PERSONAL",
    get<T>(key: string) {
      const fullKey = storageKey(key);
      const raw = storage.getItem(fullKey);
      if (raw === null) return null;
      try {
        const parsed: unknown = JSON.parse(raw);
        if (!isEnvelope(parsed) || parsed.expiresAt <= now()) {
          storage.removeItem(fullKey);
          return null;
        }
        return parsed.value as T;
      } catch {
        storage.removeItem(fullKey);
        return null;
      }
    },
    set<T>(key: string, value: T) {
      const createdAt = now();
      const envelope: StorageEnvelope<T> = { version: 1, createdAt, expiresAt: createdAt + ttlMs, value };
      storage.setItem(storageKey(key), JSON.stringify(envelope));
    },
    remove(key: string) {
      storage.removeItem(storageKey(key));
    },
    clear() {
      for (const key of keysWithPrefix(storage, prefix)) storage.removeItem(key);
    },
    migrate<T>({ source, sourceKey, targetKey, decode, removeSource = true }: LegacyMigrationOptions<T>) {
      const raw = source.getItem(sourceKey);
      if (raw === null) return "missing";
      let value: T;
      try {
        value = decode ? decode(raw) : JSON.parse(raw) as T;
      } catch {
        return "invalid";
      }
      try {
        adapter.set(targetKey, value);
        if (removeSource) source.removeItem(sourceKey);
        return "migrated";
      } catch {
        return "failed";
      }
    },
  };

  return adapter;
}
