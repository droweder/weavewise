import { pgTable, text, serial, integer, boolean, uuid, timestamptz, jsonb, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamptz("created_at").defaultNow(),
});

// Training data table
export const trainingData = pgTable("training_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  data: jsonb("data").notNull(),
  createdAt: timestamptz("created_at").defaultNow(),
});

// Training sessions table
export const trainingSessions = pgTable("training_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  status: text("status").notNull(),
  startTime: timestamptz("start_time").notNull(),
  endTime: timestamptz("end_time"),
  examplesProcessed: integer("examples_processed").default(0),
  errorMessage: text("error_message"),
  modelVersion: text("model_version"),
  createdAt: timestamptz("created_at").defaultNow(),
});

// Optimization logs table
export const optimizationLogs = pgTable("optimization_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  timestamp: timestamptz("timestamp").notNull(),
  tolerance: numeric("tolerance").notNull(),
  linesProcessed: integer("lines_processed").notNull(),
  summary: jsonb("summary").notNull(),
  createdAt: timestamptz("created_at").defaultNow(),
});

// Model weights table
export const modelWeights = pgTable("model_weights", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  version: text("version").notNull(),
  weights: jsonb("weights").notNull(),
  isActive: boolean("is_active").default(false),
  createdAt: timestamptz("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertTrainingDataSchema = createInsertSchema(trainingData).pick({
  userId: true,
  data: true,
});

export const insertTrainingSessionSchema = createInsertSchema(trainingSessions).pick({
  userId: true,
  status: true,
  startTime: true,
  endTime: true,
  examplesProcessed: true,
  errorMessage: true,
  modelVersion: true,
});

export const insertOptimizationLogSchema = createInsertSchema(optimizationLogs).pick({
  userId: true,
  timestamp: true,
  tolerance: true,
  linesProcessed: true,
  summary: true,
});

export const insertModelWeightsSchema = createInsertSchema(modelWeights).pick({
  userId: true,
  version: true,
  weights: true,
  isActive: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertTrainingData = z.infer<typeof insertTrainingDataSchema>;
export type TrainingData = typeof trainingData.$inferSelect;
export type InsertTrainingSession = z.infer<typeof insertTrainingSessionSchema>;
export type TrainingSession = typeof trainingSessions.$inferSelect;
export type InsertOptimizationLog = z.infer<typeof insertOptimizationLogSchema>;
export type OptimizationLog = typeof optimizationLogs.$inferSelect;
export type InsertModelWeights = z.infer<typeof insertModelWeightsSchema>;
export type ModelWeights = typeof modelWeights.$inferSelect;
