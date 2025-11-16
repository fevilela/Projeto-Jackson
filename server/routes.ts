import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, requireAuth } from "./auth";
import {
  insertUserSchema,
  insertAthleteSchema,
  insertTestSchema,
  insertRunningWorkoutSchema,
  insertRunningPlanSchema,
  insertPeriodizationPlanSchema,
  insertPeriodizationNoteSchema,
  insertStrengthExerciseSchema,
  insertFunctionalAssessmentSchema,
  insertExerciseSchema,
  insertMovementTypeSchema,
  insertMovementFieldSchema,
  insertAnamnesisSchema,
  updateAnamnesisSchema,
} from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res, next) => {
    try {
      console.log("[REGISTER] Request body:", JSON.stringify(req.body));

      const { username, password } = insertUserSchema.parse(req.body);
      console.log("[REGISTER] Parsed username:", username);

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        console.log("[REGISTER] User already exists");
        return res.status(400).json({ error: "Usuário já existe" });
      }

      console.log("[REGISTER] Hashing password...");
      const hashedPassword = await hashPassword(password);

      console.log("[REGISTER] Creating user...");
      const user = await storage.createUser({
        username,
        password: hashedPassword,
      });
      console.log("[REGISTER] User created:", user.id, user.username);

      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      console.error("[REGISTER] Error:", error);
      next(error);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      const { username, password } = insertUserSchema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      req.session.userId = user.id;
      res.json({ id: user.id, username: user.username });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Erro ao fazer logout" });
      }
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  app.get("/api/auth/me", async (req, res, next) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      res.json({ id: user.id, username: user.username });
    } catch (error) {
      next(error);
    }
  });

  // Athlete routes
  app.get("/api/athletes", requireAuth, async (req, res, next) => {
    try {
      const athletes = await storage.getAthletesByUserId(req.session.userId!);
      res.json(athletes);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/athletes", requireAuth, async (req, res, next) => {
    try {
      const athleteData = insertAthleteSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const athlete = await storage.createAthlete(athleteData);
      res.json(athlete);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/athletes/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteAthlete(req.params.id, req.session.userId!);
      res.json({ message: "Atleta excluído com sucesso" });
    } catch (error) {
      next(error);
    }
  });

  // Test routes
  app.get("/api/tests", requireAuth, async (req, res, next) => {
    try {
      const tests = await storage.getTestsByUserId(req.session.userId!);
      res.json(tests);
    } catch (error) {
      next(error);
    }
  });

  app.get(
    "/api/tests/athlete/:athleteId",
    requireAuth,
    async (req, res, next) => {
      try {
        const tests = await storage.getTestsByAthleteId(
          req.params.athleteId,
          req.session.userId!
        );
        res.json(tests);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post("/api/tests", requireAuth, async (req, res, next) => {
    try {
      const testData = insertTestSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const test = await storage.createTest(testData);
      res.json(test);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/tests/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteTest(req.params.id, req.session.userId!);
      res.json({ message: "Teste excluído com sucesso" });
    } catch (error) {
      next(error);
    }
  });

  // Running Workout routes
  app.get(
    "/api/running-workouts/athlete/:athleteId",
    requireAuth,
    async (req, res, next) => {
      try {
        const workouts = await storage.getRunningWorkoutsByAthleteId(
          req.params.athleteId,
          req.session.userId!
        );
        res.json(workouts);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post("/api/running-workouts", requireAuth, async (req, res, next) => {
    try {
      const workoutData = insertRunningWorkoutSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const workout = await storage.createRunningWorkout(workoutData);
      res.json(workout);
    } catch (error) {
      next(error);
    }
  });

  app.delete(
    "/api/running-workouts/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        await storage.deleteRunningWorkout(req.params.id, req.session.userId!);
        res.json({ message: "Treino de corrida excluído com sucesso" });
      } catch (error) {
        next(error);
      }
    }
  );

  // Running Plan routes
  app.get(
    "/api/running-plans/athlete/:athleteId",
    requireAuth,
    async (req, res, next) => {
      try {
        const plans = await storage.getRunningPlansByAthleteId(
          req.params.athleteId,
          req.session.userId!
        );
        res.json(plans);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post("/api/running-plans", requireAuth, async (req, res, next) => {
    try {
      const planData = insertRunningPlanSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const plan = await storage.createRunningPlan(planData);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/running-plans/:id", requireAuth, async (req, res, next) => {
    try {
      const planData = insertRunningPlanSchema.partial().parse(req.body);

      const plan = await storage.updateRunningPlan(
        req.params.id,
        req.session.userId!,
        planData
      );
      res.json(plan);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/running-plans/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteRunningPlan(req.params.id, req.session.userId!);
      res.json({ message: "Plano de corrida excluído com sucesso" });
    } catch (error) {
      next(error);
    }
  });

  // Periodization Plan routes
  app.get(
    "/api/periodization-plans/athlete/:athleteId",
    requireAuth,
    async (req, res, next) => {
      try {
        const plans = await storage.getPeriodizationPlansByAthleteId(
          req.params.athleteId,
          req.session.userId!
        );
        res.json(plans);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post("/api/periodization-plans", requireAuth, async (req, res, next) => {
    try {
      const planData = insertPeriodizationPlanSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const plan = await storage.createPeriodizationPlan(planData);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  });

  app.delete(
    "/api/periodization-plans/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        await storage.deletePeriodizationPlan(
          req.params.id,
          req.session.userId!
        );
        res.json({ message: "Plano de periodização excluído com sucesso" });
      } catch (error) {
        next(error);
      }
    }
  );

  // Periodization Note routes
  app.get(
    "/api/periodization-notes/athlete/:athleteId",
    requireAuth,
    async (req, res, next) => {
      try {
        const note = await storage.getPeriodizationNoteByAthleteId(
          req.params.athleteId,
          req.session.userId!
        );
        res.json(note || null);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post("/api/periodization-notes", requireAuth, async (req, res, next) => {
    try {
      const noteData = insertPeriodizationNoteSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const note = await storage.createPeriodizationNote(noteData);
      res.json(note);
    } catch (error) {
      next(error);
    }
  });

  app.patch(
    "/api/periodization-notes/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        const noteData = insertPeriodizationNoteSchema
          .partial()
          .parse(req.body);

        const note = await storage.updatePeriodizationNote(
          req.params.id,
          req.session.userId!,
          noteData
        );
        res.json(note);
      } catch (error) {
        next(error);
      }
    }
  );

  // Strength Exercise routes
  app.get(
    "/api/strength-exercises/athlete/:athleteId",
    requireAuth,
    async (req, res, next) => {
      try {
        const exercises = await storage.getStrengthExercisesByAthleteId(
          req.params.athleteId,
          req.session.userId!
        );
        res.json(exercises);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post("/api/strength-exercises", requireAuth, async (req, res, next) => {
    try {
      const exerciseData = insertStrengthExerciseSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const exercise = await storage.createStrengthExercise(exerciseData);
      res.json(exercise);
    } catch (error) {
      next(error);
    }
  });

  app.delete(
    "/api/strength-exercises/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        await storage.deleteStrengthExercise(
          req.params.id,
          req.session.userId!
        );
        res.json({ message: "Exercício de força excluído com sucesso" });
      } catch (error) {
        next(error);
      }
    }
  );

  // Functional Assessment routes
  app.get(
    "/api/functional-assessments/athlete/:athleteId",
    requireAuth,
    async (req, res, next) => {
      try {
        const assessments = await storage.getFunctionalAssessmentsByAthleteId(
          req.params.athleteId,
          req.session.userId!
        );
        res.json(assessments);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post(
    "/api/functional-assessments",
    requireAuth,
    async (req, res, next) => {
      try {
        const { values, ...restBody } = req.body;

        const assessmentData = insertFunctionalAssessmentSchema.parse({
          ...restBody,
          userId: req.session.userId,
        });

        const valuesArray = Array.isArray(values)
          ? values.map((v: any) => ({
              fieldId: String(v.fieldId),
              value: String(v.value || ""),
            }))
          : undefined;

        const assessment = await storage.createFunctionalAssessment(
          assessmentData,
          valuesArray
        );
        res.json(assessment);
      } catch (error) {
        next(error);
      }
    }
  );

  app.delete(
    "/api/functional-assessments/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        await storage.deleteFunctionalAssessment(
          req.params.id,
          req.session.userId!
        );
        res.json({ message: "Avaliação funcional excluída com sucesso" });
      } catch (error) {
        next(error);
      }
    }
  );

  // Exercise routes
  app.get("/api/exercises", requireAuth, async (req, res, next) => {
    try {
      const exercises = await storage.getExercisesByUserId(req.session.userId!);
      res.json(exercises);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/exercises", requireAuth, async (req, res, next) => {
    try {
      const exerciseData = insertExerciseSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const exercise = await storage.createExercise(exerciseData);
      res.json(exercise);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/exercises/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteExercise(req.params.id, req.session.userId!);
      res.json({ message: "Exercício excluído com sucesso" });
    } catch (error) {
      next(error);
    }
  });

  // Movement Type routes
  app.get("/api/movement-types", requireAuth, async (req, res, next) => {
    try {
      const movementTypes = await storage.getMovementTypesByUserId(
        req.session.userId!
      );
      res.json(movementTypes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/movement-types/:id", requireAuth, async (req, res, next) => {
    try {
      const movementType = await storage.getMovementType(
        req.params.id,
        req.session.userId!
      );
      if (!movementType) {
        return res
          .status(404)
          .json({ error: "Tipo de movimento não encontrado" });
      }
      res.json(movementType);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/movement-types", requireAuth, async (req, res, next) => {
    try {
      const movementTypeData = insertMovementTypeSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      const movementType = await storage.createMovementType(movementTypeData);
      res.json(movementType);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/movement-types/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteMovementType(req.params.id, req.session.userId!);
      res.json({ message: "Tipo de movimento excluído com sucesso" });
    } catch (error) {
      next(error);
    }
  });

  // Movement Field routes
  app.get(
    "/api/movement-types/:typeId/fields",
    requireAuth,
    async (req, res, next) => {
      try {
        const fields = await storage.getMovementFieldsByTypeId(
          req.params.typeId,
          req.session.userId!
        );
        res.json(fields);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post(
    "/api/movement-types/:typeId/fields",
    requireAuth,
    async (req, res, next) => {
      try {
        const movementType = await storage.getMovementType(
          req.params.typeId,
          req.session.userId!
        );
        if (!movementType) {
          return res
            .status(404)
            .json({ error: "Tipo de movimento não encontrado" });
        }

        const fieldData = insertMovementFieldSchema.parse({
          ...req.body,
          movementTypeId: req.params.typeId,
        });

        const field = await storage.createMovementField(fieldData);
        res.json(field);
      } catch (error) {
        next(error);
      }
    }
  );

  app.delete(
    "/api/movement-types/:typeId/fields/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        await storage.deleteMovementField(
          req.params.id,
          req.params.typeId,
          req.session.userId!
        );
        res.json({ message: "Campo excluído com sucesso" });
      } catch (error) {
        next(error);
      }
    }
  );

  // Anamnesis routes
  app.get(
    "/api/anamnesis/athlete/:athleteId",
    requireAuth,
    async (req, res, next) => {
      try {
        const anamnesisData = await storage.getAnamnesisByAthleteId(
          req.params.athleteId,
          req.session.userId!
        );
        res.json(anamnesisData);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get("/api/anamnesis/:id", requireAuth, async (req, res, next) => {
    try {
      const anamnesis = await storage.getAnamnesis(
        req.params.id,
        req.session.userId!
      );
      if (!anamnesis) {
        return res.status(404).json({ error: "Anamnese não encontrada" });
      }
      res.json(anamnesis);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/anamnesis", requireAuth, async (req, res, next) => {
    try {
      const anamnesisData = insertAnamnesisSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });

      if (!anamnesisData.athleteId) {
        return res.status(400).json({ error: "athleteId é obrigatório" });
      }

      const athlete = await storage.getAthlete(anamnesisData.athleteId);
      if (!athlete || athlete.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ error: "Atleta não encontrado ou não autorizado" });
      }

      const anamnesis = await storage.createAnamnesis(anamnesisData);
      res.json(anamnesis);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/anamnesis/:id", requireAuth, async (req, res, next) => {
    try {
      const updateData = updateAnamnesisSchema.parse(req.body);

      const anamnesis = await storage.updateAnamnesis(
        req.params.id,
        req.session.userId!,
        updateData
      );
      res.json(anamnesis);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/anamnesis/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteAnamnesis(req.params.id, req.session.userId!);
      res.json({ message: "Anamnese excluída com sucesso" });
    } catch (error) {
      next(error);
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
