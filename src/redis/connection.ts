import IORedis from "ioredis";

export const connection = new IORedis({
  maxRetriesPerRequest: null,
  host: process.env.REDIS_HOST as string,
  port: Number(process.env.REDIS_PORT),
});
