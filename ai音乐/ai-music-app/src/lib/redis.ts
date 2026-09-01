import { createClient, type RedisClientType } from "redis";

let client: RedisClientType | undefined;
let connection: Promise<RedisClientType> | undefined;

export async function getRedis() {
  if (!process.env.REDIS_URL) {
    throw new Error("REDIS_URL is not configured");
  }

  if (!client) {
    client = createClient({ url: process.env.REDIS_URL });
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
