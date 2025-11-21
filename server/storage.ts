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
  movementTypes,
  movementFields,
  functionalAssessmentValues,
  anamnesis,
  financialTransactions,
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
  type MovementType,
  type InsertMovementType,
  type MovementField,
  type InsertMovementField,
  type FunctionalAssessmentValue,
  type InsertFunctionalAssessmentValue,
  type Anamnesis,
  type InsertAnamnesis,
  type FinancialTransaction,
  type InsertFinancialTransaction,
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
  ): Promise<(FunctionalAssessment & { dynamicValues?: any[] })[]>;
  getFunctionalAssessmentWithValues(
    assessmentId: string
  ): Promise<FunctionalAssessmentValue[]>;
  createFunctionalAssessment(
    assessment: InsertFunctionalAssessment,
    values?: { fieldId: string; value: string }[]
  ): Promise<FunctionalAssessment>;
  deleteFunctionalAssessment(id: string, userId: string): Promise<void>;

  // Exercise methods
  getExercisesByUserId(userId: string): Promise<Exercise[]>;
  createExercise(exercise: InsertExercise): Promise<Exercise>;
  deleteExercise(id: string, userId: string): Promise<void>;

  // Movement Type methods
  getMovementTypesByUserId(userId: string): Promise<MovementType[]>;
  getMovementType(
    id: string,
    userId: string
  ): Promise<MovementType | undefined>;
  createMovementType(movementType: InsertMovementType): Promise<MovementType>;
  deleteMovementType(id: string, userId: string): Promise<void>;

  // Movement Field methods
  getMovementFieldsByTypeId(
    movementTypeId: string,
    userId: string
  ): Promise<MovementField[]>;
  createMovementField(field: InsertMovementField): Promise<MovementField>;
  deleteMovementField(
    id: string,
    movementTypeId: string,
    userId: string
  ): Promise<void>;

  // Anamnesis methods
  getAnamnesisByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<Anamnesis[]>;
  getAnamnesis(id: string, userId: string): Promise<Anamnesis | undefined>;
  createAnamnesis(anamnesis: InsertAnamnesis): Promise<Anamnesis>;
  updateAnamnesis(
    id: string,
    userId: string,
    anamnesis: Partial<InsertAnamnesis>
  ): Promise<Anamnesis>;
  deleteAnamnesis(id: string, userId: string): Promise<void>;

  // Financial Transaction methods
  getFinancialTransactionsByUserId(
    userId: string
  ): Promise<(FinancialTransaction & { athleteName?: string | null })[]>;
  getFinancialTransaction(
    id: string,
    userId: string
  ): Promise<FinancialTransaction | undefined>;
  createFinancialTransaction(
    transaction: InsertFinancialTransaction
  ): Promise<FinancialTransaction>;
  updateFinancialTransaction(
    id: string,
    userId: string,
    transaction: Partial<InsertFinancialTransaction>
  ): Promise<FinancialTransaction>;
  deleteFinancialTransaction(id: string, userId: string): Promise<void>;
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
  ): Promise<(FunctionalAssessment & { dynamicValues?: any[] })[]> {
    const assessments = await db
      .select()
      .from(functionalAssessments)
      .where(
        and(
          eq(functionalAssessments.athleteId, athleteId),
          eq(functionalAssessments.userId, userId)
        )
      )
      .orderBy(desc(functionalAssessments.assessmentDate));

    const enrichedAssessments = await Promise.all(
      assessments.map(async (assessment) => {
        if (!assessment.movementTypeId) {
          return { ...assessment, dynamicValues: [] };
        }

        const values = await db
          .select({
            id: functionalAssessmentValues.id,
            fieldId: functionalAssessmentValues.fieldId,
            value: functionalAssessmentValues.value,
            fieldLabel: movementFields.fieldLabel,
            fieldName: movementFields.fieldName,
          })
          .from(functionalAssessmentValues)
          .leftJoin(
            movementFields,
            eq(functionalAssessmentValues.fieldId, movementFields.id)
          )
          .where(eq(functionalAssessmentValues.assessmentId, assessment.id));

        return {
          ...assessment,
          dynamicValues: values.filter((v) => v.fieldLabel !== null),
        };
      })
    );

    return enrichedAssessments;
  }

  async getFunctionalAssessmentWithValues(
    assessmentId: string
  ): Promise<FunctionalAssessmentValue[]> {
    return await db
      .select()
      .from(functionalAssessmentValues)
      .where(eq(functionalAssessmentValues.assessmentId, assessmentId));
  }

  async createFunctionalAssessment(
    assessment: InsertFunctionalAssessment,
    values?: { fieldId: string; value: string }[]
  ): Promise<FunctionalAssessment> {
    if (values && values.length > 0 && !assessment.movementTypeId) {
      throw new Error(
        "movementTypeId é obrigatório quando valores dinâmicos são fornecidos"
      );
    }

    if (values && values.length > 0 && assessment.movementTypeId) {
      const movementType = await this.getMovementType(
        assessment.movementTypeId,
        assessment.userId
      );

      if (!movementType) {
        throw new Error("Tipo de movimento não encontrado");
      }

      const validFields = await this.getMovementFieldsByTypeId(
        assessment.movementTypeId,
        assessment.userId
      );
      const validFieldIds = new Set(validFields.map((f) => f.id));

      for (const value of values) {
        if (!validFieldIds.has(value.fieldId)) {
          throw new Error("Campo inválido para este tipo de movimento");
        }
      }
    }

    return await db.transaction(async (tx) => {
      const result = await tx
        .insert(functionalAssessments)
        .values(assessment)
        .returning();

      const createdAssessment = result[0];

      if (values && values.length > 0) {
        const valuesToInsert = values
          .filter((v) => v.value && v.value.trim() !== "")
          .map((v) => ({
            assessmentId: createdAssessment.id,
            fieldId: v.fieldId,
            value: v.value,
          }));

        if (valuesToInsert.length > 0) {
          await tx.insert(functionalAssessmentValues).values(valuesToInsert);
        }
      }

      return createdAssessment;
    });
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

  // Movement Type methods
  async getMovementTypesByUserId(userId: string): Promise<MovementType[]> {
    return await db
      .select()
      .from(movementTypes)
      .where(eq(movementTypes.userId, userId))
      .orderBy(desc(movementTypes.createdAt));
  }

  async getMovementType(
    id: string,
    userId: string
  ): Promise<MovementType | undefined> {
    const result = await db
      .select()
      .from(movementTypes)
      .where(and(eq(movementTypes.id, id), eq(movementTypes.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createMovementType(
    movementType: InsertMovementType
  ): Promise<MovementType> {
    const result = await db
      .insert(movementTypes)
      .values(movementType)
      .returning();
    return result[0];
  }

  async deleteMovementType(id: string, userId: string): Promise<void> {
    await db
      .delete(movementTypes)
      .where(and(eq(movementTypes.id, id), eq(movementTypes.userId, userId)));
  }

  // Movement Field methods
  async getMovementFieldsByTypeId(
    movementTypeId: string,
    userId: string
  ): Promise<MovementField[]> {
    const movementType = await this.getMovementType(movementTypeId, userId);
    if (!movementType) {
      return [];
    }
    return await db
      .select()
      .from(movementFields)
      .where(eq(movementFields.movementTypeId, movementTypeId))
      .orderBy(movementFields.fieldOrder);
  }

  async createMovementField(
    field: InsertMovementField
  ): Promise<MovementField> {
    const result = await db.insert(movementFields).values(field).returning();
    return result[0];
  }

  async deleteMovementField(
    id: string,
    movementTypeId: string,
    userId: string
  ): Promise<void> {
    const movementType = await this.getMovementType(movementTypeId, userId);
    if (!movementType) {
      throw new Error("Tipo de movimento não encontrado ou não autorizado");
    }
    await db
      .delete(movementFields)
      .where(
        and(
          eq(movementFields.id, id),
          eq(movementFields.movementTypeId, movementTypeId)
        )
      );
  }

  // Anamnesis methods
  async getAnamnesisByAthleteId(
    athleteId: string,
    userId: string
  ): Promise<Anamnesis[]> {
    return await db
      .select()
      .from(anamnesis)
      .where(
        and(eq(anamnesis.athleteId, athleteId), eq(anamnesis.userId, userId))
      )
      .orderBy(desc(anamnesis.createdAt));
  }

  async getAnamnesis(
    id: string,
    userId: string
  ): Promise<Anamnesis | undefined> {
    const result = await db
      .select()
      .from(anamnesis)
      .where(and(eq(anamnesis.id, id), eq(anamnesis.userId, userId)))
      .limit(1);
    return result[0];
  }

  async createAnamnesis(insertAnamnesis: InsertAnamnesis): Promise<Anamnesis> {
    const result = await db
      .insert(anamnesis)
      .values(insertAnamnesis)
      .returning();
    return result[0];
  }

  async updateAnamnesis(
    id: string,
    userId: string,
    updateData: Partial<InsertAnamnesis>
  ): Promise<Anamnesis> {
    const result = await db
      .update(anamnesis)
      .set({ ...updateData, updatedAt: new Date() })
      .where(and(eq(anamnesis.id, id), eq(anamnesis.userId, userId)))
      .returning();
    if (!result[0]) {
      throw new Error("Anamnese não encontrada ou não autorizada");
    }
    return result[0];
  }

  async deleteAnamnesis(id: string, userId: string): Promise<void> {
    await db
      .delete(anamnesis)
      .where(and(eq(anamnesis.id, id), eq(anamnesis.userId, userId)));
  }

  // Financial Transaction methods
  async getFinancialTransactionsByUserId(
    userId: string
  ): Promise<(FinancialTransaction & { athleteName?: string | null })[]> {
    const result = await db
      .select({
        id: financialTransactions.id,
        userId: financialTransactions.userId,
        athleteId: financialTransactions.athleteId,
        type: financialTransactions.type,
        description: financialTransactions.description,
        totalAmount: financialTransactions.totalAmount,
        paidAmount: financialTransactions.paidAmount,
        dueDate: financialTransactions.dueDate,
        paymentDate: financialTransactions.paymentDate,
        status: financialTransactions.status,
        observations: financialTransactions.observations,
        createdAt: financialTransactions.createdAt,
        updatedAt: financialTransactions.updatedAt,
        athleteName: athletes.name,
      })
      .from(financialTransactions)
      .leftJoin(athletes, eq(financialTransactions.athleteId, athletes.id))
      .where(eq(financialTransactions.userId, userId))
      .orderBy(desc(financialTransactions.dueDate));
    return result;
  }

  async getFinancialTransaction(
    id: string,
    userId: string
  ): Promise<FinancialTransaction | undefined> {
    const result = await db
      .select()
      .from(financialTransactions)
      .where(
        and(
          eq(financialTransactions.id, id),
          eq(financialTransactions.userId, userId)
        )
      )
      .limit(1);
    return result[0];
  }

  async createFinancialTransaction(
    transaction: InsertFinancialTransaction
  ): Promise<FinancialTransaction> {
    const result = await db
      .insert(financialTransactions)
      .values(transaction)
      .returning();
    return result[0];
  }

  async updateFinancialTransaction(
    id: string,
    userId: string,
    updateData: Partial<InsertFinancialTransaction>
  ): Promise<FinancialTransaction> {
    const result = await db
      .update(financialTransactions)
      .set({ ...updateData, updatedAt: new Date() })
      .where(
        and(
          eq(financialTransactions.id, id),
          eq(financialTransactions.userId, userId)
        )
      )
      .returning();
    if (!result[0]) {
      throw new Error("Transação não encontrada ou não autorizada");
    }
    return result[0];
  }

  async deleteFinancialTransaction(id: string, userId: string): Promise<void> {
    await db
      .delete(financialTransactions)
      .where(
        and(
          eq(financialTransactions.id, id),
          eq(financialTransactions.userId, userId)
        )
      );
  }
}

export const storage = new DatabaseStorage();
