import { describe, it, expect, vi, beforeEach } from "vitest";
import { authMiddleware, AuthenticatedRequest } from "../src/middlewares/auth";
import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

describe("Auth Middleware", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 401 if no header", () => {
    const req = { headers: {} } as unknown as AuthenticatedRequest;
    const res = mockRes();
    const next = vi.fn();

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Token de autenticação não fornecido." });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 401 for invalid token", () => {
    const req = { headers: { authorization: "Bearer badtoken" } } as unknown as AuthenticatedRequest;
    const res = mockRes();
    const next = vi.fn();

    vi.spyOn(jwt, "verify").mockImplementation(() => { throw new Error("Invalid"); });

    authMiddleware(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Sessão expirada ou token inválido." });
  });

  it("should call next for valid token", () => {
    const req = { headers: { authorization: "Bearer goodtoken" } } as unknown as AuthenticatedRequest;
    const res = mockRes();
    const next = vi.fn();

    vi.spyOn(jwt, "verify").mockReturnValue({ userId: "u1" } as any);

    authMiddleware(req, res, next);

    expect(req.userId).toBe("u1");
    expect(next).toHaveBeenCalled();
  });
});
