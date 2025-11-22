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
  name: text("name"),
  email: text("email"),
  birthDate: text("birth_date"),
  cref: text("cref"),
  profilePhoto: text("profile_photo"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const updateProfileSchema = createInsertSchema(users).pick({
  name: true,
  email: true,
  birthDate: true,
  cref: true,
  profilePhoto: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpdateProfile = z.infer<typeof updateProfileSchema>;
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

// Running Plans
export const runningPlans = pgTable("running_plans", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  startDate: text("start_date"),
  vo1: text("vo1"),
  vo2: text("vo2"),
  vo2lt: text("vo2lt"),
  vo2Dmax: text("vo2dmax"),
  tfExplanation: text("tf_explanation"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertRunningPlanSchema = createInsertSchema(runningPlans).omit({
  id: true,
  createdAt: true,
});

export type InsertRunningPlan = z.infer<typeof insertRunningPlanSchema>;
export type RunningPlan = typeof runningPlans.$inferSelect;

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

// Periodization Notes (General Observations)
export const periodizationNotes = pgTable("periodization_notes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  generalObservations: text("general_observations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPeriodizationNoteSchema = createInsertSchema(
  periodizationNotes
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertPeriodizationNote = z.infer<
  typeof insertPeriodizationNoteSchema
>;
export type PeriodizationNote = typeof periodizationNotes.$inferSelect;

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

// Movement Types (tipos de movimento customizáveis)
export const movementTypes = pgTable("movement_types", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMovementTypeSchema = createInsertSchema(movementTypes).omit({
  id: true,
  createdAt: true,
});

export type InsertMovementType = z.infer<typeof insertMovementTypeSchema>;
export type MovementType = typeof movementTypes.$inferSelect;

// Movement Fields (campos disponíveis para cada tipo de movimento)
export const movementFields = pgTable("movement_fields", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  movementTypeId: varchar("movement_type_id")
    .notNull()
    .references(() => movementTypes.id, { onDelete: "cascade" }),
  fieldName: text("field_name").notNull(),
  fieldLabel: text("field_label").notNull(),
  fieldOrder: integer("field_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertMovementFieldSchema = createInsertSchema(
  movementFields
).omit({
  id: true,
  createdAt: true,
});

export type InsertMovementField = z.infer<typeof insertMovementFieldSchema>;
export type MovementField = typeof movementFields.$inferSelect;

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
  movementTypeId: varchar("movement_type_id").references(
    () => movementTypes.id,
    { onDelete: "set null" }
  ),
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

// Exercises
export const exercises = pgTable("exercises", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExerciseSchema = createInsertSchema(exercises).omit({
  id: true,
  createdAt: true,
});

export type InsertExercise = z.infer<typeof insertExerciseSchema>;
export type Exercise = typeof exercises.$inferSelect;

// Functional Assessment Values (valores dinâmicos das avaliações)
export const functionalAssessmentValues = pgTable(
  "functional_assessment_values",
  {
    id: varchar("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    assessmentId: varchar("assessment_id")
      .notNull()
      .references(() => functionalAssessments.id, { onDelete: "cascade" }),
    fieldId: varchar("field_id")
      .notNull()
      .references(() => movementFields.id, { onDelete: "cascade" }),
    value: text("value"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  }
);

export const insertFunctionalAssessmentValueSchema = createInsertSchema(
  functionalAssessmentValues
).omit({
  id: true,
  createdAt: true,
});

export type InsertFunctionalAssessmentValue = z.infer<
  typeof insertFunctionalAssessmentValueSchema
>;
export type FunctionalAssessmentValue =
  typeof functionalAssessmentValues.$inferSelect;

// Anamnesis (Anamnese)
export const anamnesis = pgTable("anamnesis", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  athleteId: varchar("athlete_id")
    .notNull()
    .references(() => athletes.id, { onDelete: "cascade" }),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  anamnesisDate: text("anamnesis_date").notNull(),
  mainGoal: text("main_goal"),
  medicalHistory: text("medical_history"),
  injuries: text("injuries"),
  medications: text("medications"),
  surgeries: text("surgeries"),
  allergies: text("allergies"),
  familyHistory: text("family_history"),
  lifestyle: text("lifestyle"),
  sleepQuality: text("sleep_quality"),
  nutrition: text("nutrition"),
  currentActivityLevel: text("current_activity_level"),
  previousSports: text("previous_sports"),
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAnamnesisSchema = createInsertSchema(anamnesis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateAnamnesisSchema = createInsertSchema(anamnesis).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertAnamnesis = z.infer<typeof insertAnamnesisSchema>;
export type Anamnesis = typeof anamnesis.$inferSelect;

// Financial Transactions
export const financialTransactions = pgTable("financial_transactions", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  athleteId: varchar("athlete_id").references(() => athletes.id, {
    onDelete: "set null",
  }),
  type: text("type").notNull(), // "receita" ou "despesa"
  description: text("description").notNull(),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paidAmount: decimal("paid_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  dueDate: text("due_date").notNull(),
  paymentDate: text("payment_date"),
  status: text("status").notNull().default("pendente"), // "pendente", "pago_parcial", "pago"
  observations: text("observations"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertFinancialTransactionSchema = createInsertSchema(
  financialTransactions
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertFinancialTransaction = z.infer<
  typeof insertFinancialTransactionSchema
>;
export type FinancialTransaction = typeof financialTransactions.$inferSelect;
