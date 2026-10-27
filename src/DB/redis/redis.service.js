
import { redisClient } from "./connection.redis.js";

export const setValue = async ({ key, value, ttl }) => {
  const val = typeof value === "string" ? value : JSON.stringify(value);
  return ttl
    ? await redisClient.set(key, val, { EX: ttl })
    : await redisClient.set(key, val);
};

export const getValue = async (key) => await redisClient.get(key);

export const deleteKey = async (key) => await redisClient.del(key);

export const getTTL = async (key) => await redisClient.ttl(key);

export const incr = async (key) => await redisClient.incr(key);

export const expire = async ({ key, ttl }) => await redisClient.expire(key, ttl);
