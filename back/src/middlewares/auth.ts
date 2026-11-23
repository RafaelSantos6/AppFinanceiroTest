import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

export function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV === "test") {
      return "test-only-ephemeral-secret";
    }
    throw new Error("Variável de ambiente obrigatória JWT_SECRET não está definida.");
  }
  return secret;
}

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.status(401).json({ message: "Token de autenticação não fornecido." });
    return;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    res.status(401).json({ message: "Formato de token inválido." });
    return;
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { userId: string };
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: "Sessão expirada ou token inválido." });
    return;
  }
}
