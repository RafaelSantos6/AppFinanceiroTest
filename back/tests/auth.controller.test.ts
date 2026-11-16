import { describe, it, expect, vi, beforeEach } from "vitest";
import { register, login, me } from "../src/controllers/auth.controller";
import { prismaMock } from "./helpers";
import { AuthenticatedRequest } from "../src/middlewares/auth";
import { Response, Request } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

describe("Auth Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("should return 409 if user exists", async () => {
      const req = { body: { email: "test@test.com", password: "123456", name: "Test" } } as Request;
      const res = mockRes();
      prismaMock.user.findUnique.mockResolvedValue({ id: "1" });
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({ message: "Já existe uma conta com este e-mail." });
    });

    it("should register user", async () => {
      const req = { body: { email: "new@test.com", password: "123456", name: "Test" } } as Request;
      const res = mockRes();
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({ id: "1", email: "new@test.com", name: "Test", avatarUrl: null });
      
      vi.spyOn(bcrypt, "hash").mockResolvedValue("hashed_pwd" as never);
      vi.spyOn(jwt, "sign").mockReturnValue("token123" as never);

      await register(req, res);

      expect(prismaMock.user.create).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: "Usuário cadastrado com sucesso!",
        user: { id: "1", email: "new@test.com", name: "Test", avatarUrl: null },
        token: "token123"
      });
    });
    
    it("should handle invalid data", async () => {
      const req = { body: {} } as Request;
      const res = mockRes();
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle error", async () => {
      const req = { body: { email: "new@test.com", password: "123456", name: "Test" } } as Request;
      const res = mockRes();
      prismaMock.user.findUnique.mockRejectedValueOnce(new Error("DB Error"));
      await register(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("login", () => {
    it("should return 400 for invalid data", async () => {
      const req = { body: {} } as Request;
      const res = mockRes();
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should return 401 if user not found", async () => {
      const req = { body: { email: "x@x.com", password: "123456" } } as Request;
      const res = mockRes();
      prismaMock.user.findUnique.mockResolvedValue(null);
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "E-mail ou senha incorretos." });
    });

    it("should return 401 for wrong password", async () => {
      const req = { body: { email: "x@x.com", password: "123456" } } as Request;
      const res = mockRes();
      prismaMock.user.findUnique.mockResolvedValue({ id: "1", password: "hashed" });
      vi.spyOn(bcrypt, "compare").mockResolvedValue(false as never);
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: "E-mail ou senha incorretos." });
    });

    it("should login successfully", async () => {
      const req = { body: { email: "x@x.com", password: "123456" } } as Request;
      const res = mockRes();
      prismaMock.user.findUnique.mockResolvedValue({ id: "1", email: "x@x.com", name: "Test", password: "hashed", avatarUrl: null });
      vi.spyOn(bcrypt, "compare").mockResolvedValue(true as never);
      vi.spyOn(jwt, "sign").mockReturnValue("token123" as never);

      await login(req, res);
      
      expect(res.json).toHaveBeenCalledWith({
        message: "Login efetuado com sucesso!",
        user: { id: "1", email: "x@x.com", name: "Test", avatarUrl: null },
        token: "token123"
      });
    });

    it("should handle error", async () => {
      const req = { body: { email: "x@x.com", password: "123456" } } as Request;
      const res = mockRes();
      prismaMock.user.findUnique.mockRejectedValueOnce(new Error("DB Error"));
      await login(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("me", () => {
    it("should return 401 if no userId", async () => {
      const req = {} as AuthenticatedRequest;
      const res = mockRes();
      await me(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 404 if user not found", async () => {
      const req = { userId: "1" } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.user.findUnique.mockResolvedValue(null);
      await me(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return user details", async () => {
      const req = { userId: "1" } as AuthenticatedRequest;
      const res = mockRes();
      const user = { id: "1", email: "x@x.com", name: "Test", avatarUrl: null, createdAt: new Date() };
      prismaMock.user.findUnique.mockResolvedValue(user);
      await me(req, res);
      expect(res.json).toHaveBeenCalledWith({ user });
    });

    it("should handle error", async () => {
      const req = { userId: "1" } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.user.findUnique.mockRejectedValueOnce(new Error("Error"));
      await me(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
