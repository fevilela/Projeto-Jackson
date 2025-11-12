import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  integer,
  decimal,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const athletes = pgTable("athletes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  sport: text("sport").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAthleteSchema = createInsertSchema(athletes).omit({
  id: true,
  createdAt: true,
});

export type InsertAthlete = z.infer<typeof insertAthleteSchema>;
export type Athlete = typeof athletes.$inferSelect;

export const tests = pgTable("tests", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  testDate: text("test_date").notNull(),
  cmj: decimal("cmj", { precision: 5, scale: 2 }).notNull(),
  sj: decimal("sj", { precision: 5, scale: 2 }).notNull(),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTestSchema = createInsertSchema(tests).omit({
  id: true,
  createdAt: true,
});

export type InsertTest = z.infer<typeof insertTestSchema>;
export type Test = typeof tests.$inferSelect;

// Running Workouts
export const runningWorkouts = pgTable("running_workouts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  weekNumber: integer("week_number").notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0=Monday, 1=Tuesday, etc.
  dayName: text("day_name").notNull(), // Display name (Segunda, Terça, etc.)
  training: text("training").notNull(),
  distance: text("distance"),
  observations: text("observations"),
  startDate: timestamp("start_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRunningWorkoutSchema = createInsertSchema(
  runningWorkouts
).omit({
  id: true,
  createdAt: true,
});

export type InsertRunningWorkout = z.infer<typeof insertRunningWorkoutSchema>;
export type RunningWorkout = typeof runningWorkouts.$inferSelect;

// Periodization Plans
export const periodizationPlans = pgTable("periodization_plans", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  period: text("period").notNull(),
  mainFocus: text("main_focus").notNull(),
  weeklyStructure: text("weekly_structure"),
  volumeIntensity: text("volume_intensity"),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPeriodizationPlanSchema = createInsertSchema(
  periodizationPlans
).omit({
  id: true,
  createdAt: true,
});

export type InsertPeriodizationPlan = z.infer<
  typeof insertPeriodizationPlanSchema
>;
export type PeriodizationPlan = typeof periodizationPlans.$inferSelect;

// Strength Training
export const strengthExercises = pgTable("strength_exercises", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  block: text("block").notNull(),
  exercise: text("exercise").notNull(),
  sets: text("sets").notNull(),
  reps: text("reps").notNull(),
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertStrengthExerciseSchema = createInsertSchema(
  strengthExercises
).omit({
  id: true,
  createdAt: true,
});

export type InsertStrengthExercise = z.infer<
  typeof insertStrengthExerciseSchema
>;
export type StrengthExercise = typeof strengthExercises.$inferSelect;

// Functional Assessments
export const functionalAssessments = pgTable("functional_assessments", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  assessmentDate: text("assessment_date").notNull(),
  ankMobility: text("ank_mobility"),
  hipMobility: text("hip_mobility"),
  thoracicMobility: text("thoracic_mobility"),
  coreStability: text("core_stability"),
  squatPattern: text("squat_pattern"),
  lungePattern: text("lunge_pattern"),
  jumpPattern: text("jump_pattern"),
  runPattern: text("run_pattern"),
  unilateralBalance: text("unilateral_balance"),
  generalObservations: text("general_observations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertFunctionalAssessmentSchema = createInsertSchema(
  functionalAssessments
).omit({
  id: true,
  createdAt: true,
});

export type InsertFunctionalAssessment = z.infer<
  typeof insertFunctionalAssessmentSchema
>;
export type FunctionalAssessment = typeof functionalAssessments.$inferSelect;
