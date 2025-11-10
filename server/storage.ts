import { eq, and, desc } from "drizzle-orm";
import { db } from "./db";
import { users, athletes, tests, type User, type InsertUser, type Athlete, type InsertAthlete, type Test, type InsertTest } from "@shared/schema";

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
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Athlete methods
  async getAthletesByUserId(userId: string): Promise<Athlete[]> {
    return await db.select().from(athletes).where(eq(athletes.userId, userId)).orderBy(desc(athletes.createdAt));
  }

  async getAthlete(id: string): Promise<Athlete | undefined> {
    const result = await db.select().from(athletes).where(eq(athletes.id, id)).limit(1);
    return result[0];
  }

  async createAthlete(athlete: InsertAthlete): Promise<Athlete> {
    const result = await db.insert(athletes).values(athlete).returning();
    return result[0];
  }

  async deleteAthlete(id: string, userId: string): Promise<void> {
    await db.delete(athletes).where(and(eq(athletes.id, id), eq(athletes.userId, userId)));
  }

  // Test methods
  async getTestsByUserId(userId: string): Promise<(Test & { athleteName: string })[]> {
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

  async getTestsByAthleteId(athleteId: string, userId: string): Promise<Test[]> {
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
    await db.delete(tests).where(and(eq(tests.id, id), eq(tests.userId, userId)));
  }
}

export const storage = new DatabaseStorage();
