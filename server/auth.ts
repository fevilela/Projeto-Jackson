import bcrypt from "bcryptjs";
import type { Request, Response, NextFunction } from "express";

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
}

export function requireAthleteAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.session.athleteId) {
    return res.status(401).json({ error: "Não autenticado" });
  }
  next();
}

export function generateResetCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

declare module "express-session" {
  interface SessionData {
    userId: string;
    athleteId: string;
  }
}
