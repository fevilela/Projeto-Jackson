import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import {
  users,
  athletes,
  tests,
  runningWorkouts,
  periodizationPlans,
  strengthExercises,
  functionalAssessments,
  type User,
  type InsertUser,
  type Athlete,
  type InsertAthlete,
  type Test,
  type InsertTest,
  type RunningWorkout,
  type InsertRunningWorkout,
  type PeriodizationPlan,
  type InsertPeriodizationPlan,
  type StrengthExercise,
  type InsertStrengthExercise,
  type FunctionalAssessment,
  type InsertFunctionalAssessment,
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

  // Periodization Plan methods
  getPeriodizationPlansByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<PeriodizationPlan[]>;
  createPeriodizationPlan(
    plan: InsertPeriodizationPlan
  ): Promise<PeriodizationPlan>;
  deletePeriodizationPlan(id: string, userId: string): Promise<void>;

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
}

export const storage = new DatabaseStorage();
