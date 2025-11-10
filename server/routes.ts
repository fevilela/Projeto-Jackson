import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { hashPassword, verifyPassword, requireAuth } from "./auth";
import { insertUserSchema, insertAthleteSchema, insertTestSchema } from "@shared/schema";
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
      const user = await storage.createUser({ username, password: hashedPassword });
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

  app.get("/api/tests/athlete/:athleteId", requireAuth, async (req, res, next) => {
    try {
      const tests = await storage.getTestsByAthleteId(req.params.athleteId, req.session.userId!);
      res.json(tests);
    } catch (error) {
      next(error);
    }
  });

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

  const httpServer = createServer(app);

  return httpServer;
}
