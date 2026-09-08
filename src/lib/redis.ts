import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | undefined;
let connection: Promise<RedisClientType> | undefined;

export async function getRedis() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured");
  }

  if (!client) {
    // Authentication must fail closed, but it must never leave a login or
    // generation request waiting on Redis' default infinite reconnect loop.
    client = createClient({
      url: process.env.REDIS_URL,
      disableOfflineQueue: true,
      socket: {
        connectTimeout: 4_000,
        reconnectStrategy: false,
      },
    });
    client.on("error", () => undefined);
  }
  if (!connection) {
    connection = client.connect().then(() => client as RedisClientType).catch((error) => {
      connection = undefined;
      throw error;
    });
  }
  return connection;
}
