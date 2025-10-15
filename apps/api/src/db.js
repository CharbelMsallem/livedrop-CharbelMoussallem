import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

let db;

export async function connectToDb() {
  if (db) {
    return db;
  }

  try {
    await client.connect();
    db = client.db(); 
    console.log("Successfully connected to MongoDB Atlas!");
    return db;
  } catch (err) {
    console.error("Failed to connect to MongoDB Atlas", err);
    process.exit(1);
  }
}

export const getDb = () => {
  if (!db) {
    throw new Error('Database not initialized. Call connectToDb first.');
  }
  return db;
};