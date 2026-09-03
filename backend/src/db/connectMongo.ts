// db/connectMongo.ts
import mongoose from "mongoose";
import { MONGODB_URI } from "../dnotifier/env.js";

export async function connectMongo(): Promise<void> {
  await mongoose.connect(MONGODB_URI);
  console.log("[mongo] connected");
}