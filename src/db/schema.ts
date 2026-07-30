import { pgTable, text, timestamp, varchar, serial, jsonb } from "drizzle-orm/pg-core";

export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  key: varchar("key", { length: 255 }).notNull().unique(),
  value: text("value").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: varchar("id", { length: 64 }).primaryKey(),
  status: varchar("status", { length: 32 }).notNull().default("pending"),
  videoUrl: text("video_url").notNull(),
  prompt: text("prompt").notNull(),
  aspectRatio: varchar("aspect_ratio", { length: 16 }).notNull().default("16:9"),
  model: varchar("model", { length: 64 }).notNull(),
  clipStart: varchar("clip_start", { length: 32 }),
  clipEnd: varchar("clip_end", { length: 32 }),
  outputPath: text("output_path"),
  originalPath: text("original_path"),
  error: text("error"),
  analysisResult: jsonb("analysis_result"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
