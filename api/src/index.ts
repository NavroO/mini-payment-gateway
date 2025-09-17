import "dotenv/config";
import express from "express";
import Redis from "ioredis";
import mongoose from "mongoose";
import { Pool } from "pg";

export const PAYMENT_STATUS = {
  PENDING: "PENDING",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
} as const;

export const pg = new Pool({ connectionString: process.env.POSTGRES_URL });
export const mongo = mongoose.connect(process.env.MONGO_URL!);
export const redis = new Redis(process.env.REDIS_URL!);

const app = express();
app.use(express.json());

app.post("/transactions", async (req, res) => {
  const { amount, userId } = req.body;
  const client = await pg.connect();
  const result = await client.query(
    "INSERT INTO transactions(user_id, amount, status) VALUES($1,$2,$3) RETURNING id",
    [userId, amount, PAYMENT_STATUS.PENDING]
  );
  client.release();

  res.json({ id: result.rows[0].id, status: "PENDING" });
});

app.get("/transactions/:id", async (req, res) => {
  const id = req.params.id;

  const cached = await redis.get(`txn:${id}`);
  if (cached) return res.json(JSON.parse(cached));

  const client = await pg.connect();
  const result = await client.query("SELECT * FROM transactions WHERE id=$1", [
    id,
  ]);
  client.release();

  if (result.rowCount === 0) return res.status(404).send("Not found");

  await redis.setex(`txn:${id}`, 60, JSON.stringify(result.rows[0]));
  res.json(result.rows[0]);
});

app.listen(3000, () => console.log(`API running on 3000`));
