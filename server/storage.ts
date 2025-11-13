import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  athletes,
  tests,
  runningWorkouts,
  runningPlans,
  periodizationPlans,
  periodizationNotes,
  strengthExercises,
  functionalAssessments,
  exercises,
  type User,
  type InsertUser,
  type Athlete,
  type InsertAthlete,
  type Test,
  type InsertTest,
  type RunningWorkout,
  type InsertRunningWorkout,
  type RunningPlan,
  type InsertRunningPlan,
  type PeriodizationPlan,
  type InsertPeriodizationPlan,
  type PeriodizationNote,
  type InsertPeriodizationNote,
  type StrengthExercise,
  type InsertStrengthExercise,
  type FunctionalAssessment,
  type InsertFunctionalAssessment,
  type Exercise,
  type InsertExercise,
} from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Athlete methods
  getAthletesByUserId(userId: string): Promise<Athlete[]>;
  getAthlete(id: string): Promise<Athlete | undefined>;
  createAthlete(athlete: InsertAthlete): Promise<Athlete>;
  deleteAthlete(id: string, userId: string): Promise<void>;

  // Test methods
  getTestsByUserId(userId: string): Promise<(Test & { athleteName: string })[]>;
  getTestsByAthleteId(athleteId: string, userId: string): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;
  deleteTest(id: string, userId: string): Promise<void>;

  // Running Workout methods
  getRunningWorkoutsByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<RunningWorkout[]>;
  createRunningWorkout(workout: InsertRunningWorkout): Promise<RunningWorkout>;
  deleteRunningWorkout(id: string, userId: string): Promise<void>;

  // Running Plan methods
  getRunningPlansByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<RunningPlan[]>;
  createRunningPlan(plan: InsertRunningPlan): Promise<RunningPlan>;
  updateRunningPlan(
    id: string,
    userId: string,
    plan: Partial<InsertRunningPlan>
  ): Promise<RunningPlan>;
  deleteRunningPlan(id: string, userId: string): Promise<void>;

  // Periodization Plan methods
  getPeriodizationPlansByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<PeriodizationPlan[]>;
  createPeriodizationPlan(
    plan: InsertPeriodizationPlan
  ): Promise<PeriodizationPlan>;
  deletePeriodizationPlan(id: string, userId: string): Promise<void>;

  // Periodization Note methods
  getPeriodizationNoteByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<PeriodizationNote | undefined>;
  createPeriodizationNote(
    note: InsertPeriodizationNote
  ): Promise<PeriodizationNote>;
  updatePeriodizationNote(
    id: string,
    userId: string,
    note: Partial<InsertPeriodizationNote>
  ): Promise<PeriodizationNote>;

  // Strength Exercise methods
  getStrengthExercisesByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<StrengthExercise[]>;
  createStrengthExercise(
    exercise: InsertStrengthExercise
  ): Promise<StrengthExercise>;
  deleteStrengthExercise(id: string, userId: string): Promise<void>;

  // Functional Assessment methods
  getFunctionalAssessmentsByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<FunctionalAssessment[]>;
  createFunctionalAssessment(
    assessment: InsertFunctionalAssessment
  ): Promise<FunctionalAssessment>;
  deleteFunctionalAssessment(id: string, userId: string): Promise<void>;

  // Exercise methods
  getExercisesByUserId(userId: string): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  deleteExercise(id: string, userId: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Athlete methods
  async getAthletesByUserId(userId: string): Promise<Athlete[]> {
    return await db
      .select()
      .from(athletes)
      .where(eq(athletes.userId, userId))
      .orderBy(desc(athletes.createdAt));
  }

  async getAthlete(id: string): Promise<Athlete | undefined> {
    const result = await db
      .select()
      .from(athletes)
      .where(eq(athletes.id, id))
      .limit(1);
    return result[0];
  }

  async createAthlete(athlete: InsertAthlete): Promise<Athlete> {
    const result = await db.insert(athletes).values(athlete).returning();
    return result[0];
  }

  async deleteAthlete(id: string, userId: string): Promise<void> {
    await db
      .delete(athletes)
      .where(and(eq(athletes.id, id), eq(athletes.userId, userId)));
  }

  // Test methods
  async getTestsByUserId(
    userId: string
  ): Promise<(Test & { athleteName: string })[]> {
    const result = await db
      .select({
        id: tests.id,
        athleteId: tests.athleteId,
        userId: tests.userId,
        testDate: tests.testDate,
        cmj: tests.cmj,
        sj: tests.sj,
        observations: tests.observations,
        createdAt: tests.createdAt,
        athleteName: athletes.name,
      })
      .from(tests)
      .innerJoin(athletes, eq(tests.athleteId, athletes.id))
      .where(eq(tests.userId, userId))
      .orderBy(desc(tests.createdAt));

    return result;
  }

  async getTestsByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<Test[]> {
    return await db
      .select()
      .from(tests)
      .where(and(eq(tests.athleteId, athleteId), eq(tests.userId, userId)))
      .orderBy(tests.testDate);
  }

  async createTest(test: InsertTest): Promise<Test> {
    const result = await db.insert(tests).values(test).returning();
    return result[0];
  }

  async deleteTest(id: string, userId: string): Promise<void> {
    await db
      .delete(tests)
      .where(and(eq(tests.id, id), eq(tests.userId, userId)));
  }

  // Running Workout methods
  async getRunningWorkoutsByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<RunningWorkout[]> {
    return await db
      .select()
      .from(runningWorkouts)
      .where(
        and(
          eq(runningWorkouts.athleteId, athleteId),
          eq(runningWorkouts.userId, userId)
        )
      )
      .orderBy(runningWorkouts.weekNumber, runningWorkouts.dayOfWeek);
  }

  async createRunningWorkout(
    workout: InsertRunningWorkout
  ): Promise<RunningWorkout> {
    const result = await db.insert(runningWorkouts).values(workout).returning();
    return result[0];
  }

  async deleteRunningWorkout(id: string, userId: string): Promise<void> {
    await db
      .delete(runningWorkouts)
      .where(
        and(eq(runningWorkouts.id, id), eq(runningWorkouts.userId, userId))
      );
  }

  // Running Plan methods
  async getRunningPlansByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<RunningPlan[]> {
    return await db
      .select()
      .from(runningPlans)
      .where(
        and(
          eq(runningPlans.athleteId, athleteId),
          eq(runningPlans.userId, userId)
        )
      )
      .orderBy(desc(runningPlans.createdAt));
  }

  async createRunningPlan(plan: InsertRunningPlan): Promise<RunningPlan> {
    const result = await db.insert(runningPlans).values(plan).returning();
    return result[0];
  }

  async updateRunningPlan(
    id: string,
    userId: string,
    plan: Partial<InsertRunningPlan>
  ): Promise<RunningPlan> {
    const result = await db
      .update(runningPlans)
      .set(plan)
      .where(and(eq(runningPlans.id, id), eq(runningPlans.userId, userId)))
      .returning();
    return result[0];
  }

  async deleteRunningPlan(id: string, userId: string): Promise<void> {
    await db
      .delete(runningPlans)
      .where(and(eq(runningPlans.id, id), eq(runningPlans.userId, userId)));
  }

  // Periodization Plan methods
  async getPeriodizationPlansByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<PeriodizationPlan[]> {
    return await db
      .select()
      .from(periodizationPlans)
      .where(
        and(
          eq(periodizationPlans.athleteId, athleteId),
          eq(periodizationPlans.userId, userId)
        )
      )
      .orderBy(desc(periodizationPlans.createdAt));
  }

  async createPeriodizationPlan(
    plan: InsertPeriodizationPlan
  ): Promise<PeriodizationPlan> {
    const result = await db.insert(periodizationPlans).values(plan).returning();
    return result[0];
  }

  async deletePeriodizationPlan(id: string, userId: string): Promise<void> {
    await db
      .delete(periodizationPlans)
      .where(
        and(
          eq(periodizationPlans.id, id),
          eq(periodizationPlans.userId, userId)
        )
      );
  }

  // Periodization Note methods
  async getPeriodizationNoteByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<PeriodizationNote | undefined> {
    const result = await db
      .select()
      .from(periodizationNotes)
      .where(
        and(
          eq(periodizationNotes.athleteId, athleteId),
          eq(periodizationNotes.userId, userId)
        )
      )
      .limit(1);
    return result[0];
  }

  async createPeriodizationNote(
    note: InsertPeriodizationNote
  ): Promise<PeriodizationNote> {
    const result = await db.insert(periodizationNotes).values(note).returning();
    return result[0];
  }

  async updatePeriodizationNote(
    id: string,
    userId: string,
    note: Partial<InsertPeriodizationNote>
  ): Promise<PeriodizationNote> {
    const result = await db
      .update(periodizationNotes)
      .set({ ...note, updatedAt: new Date() })
      .where(
        and(
          eq(periodizationNotes.id, id),
          eq(periodizationNotes.userId, userId)
        )
      )
      .returning();
    return result[0];
  }

  // Strength Exercise methods
  async getStrengthExercisesByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<StrengthExercise[]> {
    return await db
      .select()
      .from(strengthExercises)
      .where(
        and(
          eq(strengthExercises.athleteId, athleteId),
          eq(strengthExercises.userId, userId)
        )
      )
      .orderBy(desc(strengthExercises.createdAt));
  }

  async createStrengthExercise(
    exercise: InsertStrengthExercise
  ): Promise<StrengthExercise> {
    const result = await db
      .insert(strengthExercises)
      .values(exercise)
      .returning();
    return result[0];
  }

  async deleteStrengthExercise(id: string, userId: string): Promise<void> {
    await db
      .delete(strengthExercises)
      .where(
        and(eq(strengthExercises.id, id), eq(strengthExercises.userId, userId))
      );
  }

  // Functional Assessment methods
  async getFunctionalAssessmentsByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<FunctionalAssessment[]> {
    return await db
      .select()
      .from(functionalAssessments)
      .where(
        and(
          eq(functionalAssessments.athleteId, athleteId),
          eq(functionalAssessments.userId, userId)
        )
      )
      .orderBy(desc(functionalAssessments.assessmentDate));
  }

  async createFunctionalAssessment(
    assessment: InsertFunctionalAssessment
  ): Promise<FunctionalAssessment> {
    const result = await db
      .insert(functionalAssessments)
      .values(assessment)
      .returning();
    return result[0];
  }

  async deleteFunctionalAssessment(id: string, userId: string): Promise<void> {
    await db
      .delete(functionalAssessments)
      .where(
        and(
          eq(functionalAssessments.id, id),
          eq(functionalAssessments.userId, userId)
        )
      );
  }

  // Exercise methods
  async getExercisesByUserId(userId: string): Promise<Exercise[]> {
    return await db
      .select()
      .from(exercises)
      .where(eq(exercises.userId, userId))
      .orderBy(desc(exercises.createdAt));
  }

  async createExercise(exercise: InsertExercise): Promise<Exercise> {
    const result = await db.insert(exercises).values(exercise).returning();
    return result[0];
  }

  async deleteExercise(id: string, userId: string): Promise<void> {
    await db
      .delete(exercises)
      .where(and(eq(exercises.id, id), eq(exercises.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
