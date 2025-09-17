import Redis from "ioredis";
import mongoose from "mongoose";
import { Pool } from "pg";

export const pg = new Pool({ connectionString: process.env.POSTGRES_URL });
export const mongo = mongoose.connect(process.env.MONGO_URL!);
export const redis = new Redis(process.env.REDIS_URL!);
