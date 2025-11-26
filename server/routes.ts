import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, requireAuth } from "./auth";
import {
  insertUserSchema,
  updateProfileSchema,
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
  insertFinancialTransactionSchema,
  requestPasswordResetSchema,
} from "@shared/schema";
import { z } from "zod";
import { sendEmail, generatePasswordResetEmail } from "./email";

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

      req.session.save((err) => {
        if (err) {
          console.error("[REGISTER] Error saving session:", err);
          return next(err);
        }
        console.log("[REGISTER] Session saved successfully for user:", user.id);
        res.json({
          id: user.id,
          username: user.username,
          profilePhoto: user.profilePhoto,
          dashboardImage: user.dashboardImage,
        });
      });
    } catch (error) {
      console.error("[REGISTER] Error:", error);
      next(error);
    }
  });

  app.post("/api/auth/login", async (req, res, next) => {
    try {
      console.log("[LOGIN] Attempting login for:", req.body.username);
      const { username, password } = insertUserSchema.parse(req.body);

      const user = await storage.getUserByUsername(username);
      if (!user) {
        console.log("[LOGIN] User not found:", username);
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      const valid = await verifyPassword(password, user.password);
      if (!valid) {
        console.log("[LOGIN] Invalid password for user:", username);
        return res.status(401).json({ error: "Credenciais inválidas" });
      }

      console.log("[LOGIN] Password valid, setting session for user:", user.id);
      req.session.userId = user.id;

      req.session.save((err) => {
        if (err) {
          console.error("[LOGIN] Error saving session:", err);
          return next(err);
        }
        console.log("[LOGIN] Session saved successfully for user:", user.id);
        console.log("[LOGIN] Session ID:", req.sessionID);
        console.log("[LOGIN] Session data:", req.session);
        console.log("[LOGIN] Set-Cookie header:", res.getHeader("Set-Cookie"));
        res.json({
          id: user.id,
          username: user.username,
          profilePhoto: user.profilePhoto,
          dashboardImage: user.dashboardImage,
        });
      });
    } catch (error) {
      console.error("[LOGIN] Error during login:", error);
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
      console.log("[AUTH/ME] Session ID:", req.sessionID);
      console.log("[AUTH/ME] Session data:", req.session);
      console.log("[AUTH/ME] Checking session, userId:", req.session.userId);

      if (!req.session.userId) {
        return res.status(401).json({ error: "Não autenticado" });
      }

      const user = await storage.getUser(req.session.userId);
      if (!user) {
        console.log("[AUTH/ME] User not found for id:", req.session.userId);
        return res.status(404).json({ error: "Usuário não encontrado" });
      }

      console.log("[AUTH/ME] User authenticated:", user.username);
      res.json({
        id: user.id,
        username: user.username,
        profilePhoto: user.profilePhoto,
        dashboardImage: user.dashboardImage,
      });
    } catch (error) {
      console.error("[AUTH/ME] Error:", error);
      next(error);
    }
  });

  app.post("/api/auth/forgot-password", async (req, res, next) => {
    try {
      const { email } = requestPasswordResetSchema.parse(req.body);

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.json({
          message:
            "Se o email estiver cadastrado, você receberá um código de recuperação.",
        });
      }

      await storage.deleteExpiredPasswordResetTokens();

      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await storage.createPasswordResetToken(user.id, resetCode, expiresAt);

      const emailHtml = generatePasswordResetEmail(resetCode);

      // Ensure we have an email address before attempting to send
      if (!user.email) {
        console.error("[FORGOT-PASSWORD] No email found for user:", user.id);
        return res.status(500).json({ error: "Erro ao enviar email." });
      }

      const emailSent = await sendEmail({
        to: user.email,
        subject: "Recuperação de Senha",
        html: emailHtml,
      });

      if (!emailSent) {
        return res.status(500).json({ error: "Erro ao enviar email." });
      }

      res.json({
        message:
          "Se o email estiver cadastrado, você receberá um código de recuperação.",
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/auth/reset-password", async (req, res, next) => {
    try {
      const resetSchema = z.object({
        token: z.string(),
        newPassword: z.string().min(6),
      });
      const { token, newPassword } = resetSchema.parse(req.body);

      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken) {
        return res.status(400).json({ error: "Código inválido ou expirado" });
      }

      if (new Date() > new Date(resetToken.expiresAt)) {
        await storage.deletePasswordResetToken(token);
        return res.status(400).json({ error: "Código expirado" });
      }

      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(resetToken.userId, hashedPassword);
      await storage.deletePasswordResetToken(token);

      res.json({ message: "Senha redefinida com sucesso" });
    } catch (error) {
      next(error);
    }
  });
  app.get("/api/profile", requireAuth, async (req, res, next) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "Usuário não encontrado" });
      }
      res.json({
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        birthDate: user.birthDate,
        cref: user.cref,
        profilePhoto: user.profilePhoto,
        dashboardImage: user.dashboardImage,
      });
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/profile", requireAuth, async (req, res, next) => {
    try {
      const data = updateProfileSchema.parse(req.body);
      const updatedUser = await storage.updateUserProfile(
        req.session.userId!,
        data
      );
      res.json({
        id: updatedUser.id,
        username: updatedUser.username,
        name: updatedUser.name,
        email: updatedUser.email,
        birthDate: updatedUser.birthDate,
        cref: updatedUser.cref,
        profilePhoto: updatedUser.profilePhoto,
        dashboardImage: updatedUser.dashboardImage,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/athletes", requireAuth, async (req, res, next) => {
    try {
      const athletes = await storage.getAthletesByUserId(req.session.userId!);
      res.json(athletes);
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/athletes/:id", requireAuth, async (req, res, next) => {
    try {
      const athlete = await storage.getAthlete(req.params.id);
      if (!athlete) {
        return res.status(404).json({ error: "Atleta não encontrado" });
      }
      if (athlete.userId !== req.session.userId) {
        return res
          .status(403)
          .json({ error: "Atleta não encontrado ou não autorizado" });
      }
      res.json(athlete);
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/athletes", requireAuth, async (req, res, next) => {
    try {
      const data = insertAthleteSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      const athlete = await storage.createAthlete(data);
      res.json(athlete);
    } catch (error) {
      next(error);
    }
  });

  app.patch("/api/athletes/:id", requireAuth, async (req, res, next) => {
    try {
      const data = insertAthleteSchema.partial().parse(req.body);
      const athlete = await storage.updateAthlete(
        req.params.id,
        req.session.userId!,
        data
      );
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

  app.get("/api/athletes/:id/report", requireAuth, async (req, res, next) => {
    try {
      const athleteId = req.params.id;
      const userId = req.session.userId!;

      const athlete = await storage.getAthlete(athleteId);
      if (!athlete || athlete.userId !== userId) {
        return res.status(404).json({ error: "Atleta não encontrado" });
      }

      const [
        tests,
        anamnesis,
        runningWorkouts,
        runningPlans,
        periodizationPlans,
        strengthExercises,
        functionalAssessments,
        periodizationNote,
      ] = await Promise.all([
        storage.getTestsByAthleteId(athleteId, userId),
        storage.getAnamnesisByAthleteId(athleteId, userId),
        storage.getRunningWorkoutsByAthleteId(athleteId, userId),
        storage.getRunningPlansByAthleteId(athleteId, userId),
        storage.getPeriodizationPlansByAthleteId(athleteId, userId),
        storage.getStrengthExercisesByAthleteId(athleteId, userId),
        storage.getFunctionalAssessmentsByAthleteId(athleteId, userId),
        storage.getPeriodizationNoteByAthleteId(athleteId, userId),
      ]);

      res.json({
        athlete,
        tests,
        anamnesis,
        runningWorkouts,
        runningPlans,
        periodizationPlans,
        periodizationNote,
        strengthExercises,
        functionalAssessments,
      });
    } catch (error) {
      next(error);
    }
  });

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
      const data = insertTestSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      const test = await storage.createTest(data);
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
      const data = insertRunningWorkoutSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      const workout = await storage.createRunningWorkout(data);
      res.json(workout);
    } catch (error) {
      next(error);
    }
  });

  app.patch(
    "/api/running-workouts/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        const data = insertRunningWorkoutSchema.partial().parse(req.body);
        const workout = await storage.updateRunningWorkout(
          req.params.id,
          req.session.userId!,
          data
        );
        res.json(workout);
      } catch (error) {
        next(error);
      }
    }
  );

  app.delete(
    "/api/running-workouts/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        await storage.deleteRunningWorkout(req.params.id, req.session.userId!);
        res.json({ message: "Treino excluído com sucesso" });
      } catch (error) {
        next(error);
      }
    }
  );

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
      const data = insertRunningPlanSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      const plan = await storage.createRunningPlan(data);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  });

  app.delete("/api/running-plans/:id", requireAuth, async (req, res, next) => {
    try {
      await storage.deleteRunningPlan(req.params.id, req.session.userId!);
      res.json({ message: "Plano excluído com sucesso" });
    } catch (error) {
      next(error);
    }
  });

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
      const data = insertPeriodizationPlanSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      const plan = await storage.createPeriodizationPlan(data);
      res.json(plan);
    } catch (error) {
      next(error);
    }
  });

  // app.patch(
  //   "/api/periodization-plans/:id",
  //   requireAuth,
  //   async (req, res, next) => {
  //     try {
  //       const data = insertPeriodizationPlanSchema.partial().parse(req.body);
  //       const plan = await storage.updatePeriodizationPlan(
  //         req.params.id,
  //         req.session.userId!,
  //         data
  //       );
  //       res.json(plan);
  //     } catch (error) {
  //       next(error);
  //     }
  //   }
  // );

  app.delete(
    "/api/periodization-plans/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        await storage.deletePeriodizationPlan(
          req.params.id,
          req.session.userId!
        );
        res.json({ message: "Plano excluído com sucesso" });
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    "/api/periodization-notes/athlete/:athleteId",
    requireAuth,
    async (req, res, next) => {
      try {
        const notes = await storage.getPeriodizationNoteByAthleteId(
          req.params.athleteId,
          req.session.userId!
        );
        res.json(notes);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post("/api/periodization-notes", requireAuth, async (req, res, next) => {
    try {
      const data = insertPeriodizationNoteSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      const note = await storage.createPeriodizationNote(data);
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
        const data = insertPeriodizationNoteSchema.partial().parse(req.body);
        const note = await storage.updatePeriodizationNote(
          req.params.id,
          req.session.userId!,
          data
        );
        res.json(note);
      } catch (error) {
        next(error);
      }
    }
  );

  app.delete(
    "/api/periodization-notes/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        await storage.deletePeriodizationNote(
          req.params.id,
          req.session.userId!
        );
        res.json({ message: "Anotação excluída com sucesso" });
      } catch (error) {
        next(error);
      }
    }
  );

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
      const data = insertStrengthExerciseSchema.parse({
        ...req.body,
        userId: req.session.userId,
      });
      const exercise = await storage.createStrengthExercise(data);
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
        res.json({ message: "Exercício excluído com sucesso" });
      } catch (error) {
        next(error);
      }
    }
  );

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

  // Financial Transaction routes
  app.get(
    "/api/financial-transactions",
    requireAuth,
    async (req, res, next) => {
      try {
        const transactions = await storage.getFinancialTransactionsByUserId(
          req.session.userId!
        );
        res.json(transactions);
      } catch (error) {
        next(error);
      }
    }
  );

  app.get(
    "/api/financial-transactions/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        const transaction = await storage.getFinancialTransaction(
          req.params.id,
          req.session.userId!
        );
        if (!transaction) {
          return res.status(404).json({ error: "Transação não encontrada" });
        }
        res.json(transaction);
      } catch (error) {
        next(error);
      }
    }
  );

  app.post(
    "/api/financial-transactions",
    requireAuth,
    async (req, res, next) => {
      try {
        // Remover userId do body e sempre usar da sessão
        const { userId: _ignoredUserId, ...bodyData } = req.body;
        const transactionData = insertFinancialTransactionSchema.parse({
          ...bodyData,
          userId: req.session.userId!,
        });

        if (transactionData.athleteId) {
          const athlete = await storage.getAthlete(transactionData.athleteId);
          if (!athlete || athlete.userId !== req.session.userId) {
            return res
              .status(403)
              .json({ error: "Atleta não encontrado ou não autorizado" });
          }
        }

        const transaction = await storage.createFinancialTransaction(
          transactionData
        );
        res.json(transaction);
      } catch (error) {
        next(error);
      }
    }
  );

  app.patch(
    "/api/financial-transactions/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        // Remover userId do body e sempre usar da sessão
        const { userId: _ignoredUserId, ...bodyData } = req.body;
        const updateData = insertFinancialTransactionSchema
          .partial()
          .parse(bodyData);

        // Não permitir atualizar userId
        if (updateData.userId) {
          delete updateData.userId;
        }

        if (updateData.athleteId) {
          const athlete = await storage.getAthlete(updateData.athleteId);
          if (!athlete || athlete.userId !== req.session.userId) {
            return res
              .status(403)
              .json({ error: "Atleta não encontrado ou não autorizado" });
          }
        }

        const transaction = await storage.updateFinancialTransaction(
          req.params.id,
          req.session.userId!,
          updateData
        );
        res.json(transaction);
      } catch (error) {
        next(error);
      }
    }
  );

  app.delete(
    "/api/financial-transactions/:id",
    requireAuth,
    async (req, res, next) => {
      try {
        await storage.deleteFinancialTransaction(
          req.params.id,
          req.session.userId!
        );
        res.json({ message: "Transação excluída com sucesso" });
      } catch (error) {
        next(error);
      }
    }
  );

  const httpServer = createServer(app);

  return httpServer;
}
