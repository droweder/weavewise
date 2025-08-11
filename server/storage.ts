import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { eq, and, desc } from "drizzle-orm";
import {
  users,
  trainingData,
  trainingSessions,
  optimizationLogs,
  modelWeights,
  type User,
  type InsertUser,
  type TrainingData,
  type InsertTrainingData,
  type TrainingSession,
  type InsertTrainingSession,
  type OptimizationLog,
  type InsertOptimizationLog,
  type ModelWeights,
  type InsertModelWeights
} from "@shared/schema";

// Database connection
const connectionString = process.env.DATABASE_URL!;
const client = postgres(connectionString);
const db = drizzle(client);

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Training data operations
  getTrainingData(userId: string): Promise<TrainingData[]>;
  createTrainingData(data: InsertTrainingData): Promise<TrainingData>;
  
  // Training sessions operations
  getTrainingSessions(userId: string): Promise<TrainingSession[]>;
  createTrainingSession(session: InsertTrainingSession): Promise<TrainingSession>;
  updateTrainingSession(id: string, updates: Partial<TrainingSession>): Promise<TrainingSession | undefined>;
  
  // Optimization logs operations
  getOptimizationLogs(userId: string): Promise<OptimizationLog[]>;
  createOptimizationLog(log: InsertOptimizationLog): Promise<OptimizationLog>;
  
  // Model weights operations
  getModelWeights(userId: string): Promise<ModelWeights[]>;
  getActiveModelWeights(userId: string): Promise<ModelWeights | undefined>;
  createModelWeights(weights: InsertModelWeights): Promise<ModelWeights>;
  setActiveModel(userId: string, modelId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const result = await db.insert(users).values(user).returning();
    return result[0];
  }

  // Training data operations
  async getTrainingData(userId: string): Promise<TrainingData[]> {
    return await db.select().from(trainingData)
      .where(eq(trainingData.userId, userId))
      .orderBy(desc(trainingData.createdAt));
  }

  async createTrainingData(data: InsertTrainingData): Promise<TrainingData> {
    const result = await db.insert(trainingData).values(data).returning();
    return result[0];
  }

  // Training sessions operations
  async getTrainingSessions(userId: string): Promise<TrainingSession[]> {
    return await db.select().from(trainingSessions)
      .where(eq(trainingSessions.userId, userId))
      .orderBy(desc(trainingSessions.createdAt));
  }

  async createTrainingSession(session: InsertTrainingSession): Promise<TrainingSession> {
    const result = await db.insert(trainingSessions).values(session).returning();
    return result[0];
  }

  async updateTrainingSession(id: string, updates: Partial<TrainingSession>): Promise<TrainingSession | undefined> {
    const result = await db.update(trainingSessions)
      .set(updates)
      .where(eq(trainingSessions.id, id))
      .returning();
    return result[0];
  }

  // Optimization logs operations
  async getOptimizationLogs(userId: string): Promise<OptimizationLog[]> {
    return await db.select().from(optimizationLogs)
      .where(eq(optimizationLogs.userId, userId))
      .orderBy(desc(optimizationLogs.timestamp));
  }

  async createOptimizationLog(log: InsertOptimizationLog): Promise<OptimizationLog> {
    const result = await db.insert(optimizationLogs).values(log).returning();
    return result[0];
  }

  // Model weights operations
  async getModelWeights(userId: string): Promise<ModelWeights[]> {
    return await db.select().from(modelWeights)
      .where(eq(modelWeights.userId, userId))
      .orderBy(desc(modelWeights.createdAt));
  }

  async getActiveModelWeights(userId: string): Promise<ModelWeights | undefined> {
    const result = await db.select().from(modelWeights)
      .where(and(eq(modelWeights.userId, userId), eq(modelWeights.isActive, true)));
    return result[0];
  }

  async createModelWeights(weights: InsertModelWeights): Promise<ModelWeights> {
    const result = await db.insert(modelWeights).values(weights).returning();
    return result[0];
  }

  async setActiveModel(userId: string, modelId: string): Promise<void> {
    // First, deactivate all models for the user
    await db.update(modelWeights)
      .set({ isActive: false })
      .where(eq(modelWeights.userId, userId));
    
    // Then activate the specified model
    await db.update(modelWeights)
      .set({ isActive: true })
      .where(and(eq(modelWeights.userId, userId), eq(modelWeights.id, modelId)));
  }
}

export const storage = new DatabaseStorage();
