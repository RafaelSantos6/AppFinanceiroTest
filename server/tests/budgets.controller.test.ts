import { describe, it, expect, vi, beforeEach } from "vitest";
import { getBudgets, createBudget, updateBudget, deleteBudget } from "../src/controllers/budgets.controller";
import { prismaMock } from "./helpers";
import { AuthenticatedRequest } from "../src/middlewares/auth";
import { Response } from "express";

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

describe("Budgets Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getBudgets", () => {
    it("should list budgets", async () => {
      const req = { userId: "user1" } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.budget.findMany.mockResolvedValue([{ id: "b1", category: "Food" }]);
      await getBudgets(req, res);
      expect(prismaMock.budget.findMany).toHaveBeenCalledWith({ where: { userId: "user1" }, orderBy: { category: "asc" } });
      expect(res.json).toHaveBeenCalledWith([{ id: "b1", category: "Food" }]);
    });
    
    it("should handle error", async () => {
      const req = { userId: "user1" } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.budget.findMany.mockRejectedValueOnce(new Error("DB Error"));
      await getBudgets(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createBudget", () => {
    it("should create budget", async () => {
      const req = { userId: "u1", body: { category: "Food", limit: 100, month: "2026-01" } } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.budget.create.mockResolvedValue({ id: "b1", category: "Food" });
      await createBudget(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: "b1", category: "Food" });
    });

    it("should return 400 for invalid data", async () => {
      const req = { userId: "u1", body: {} } as AuthenticatedRequest;
      const res = mockRes();
      await createBudget(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle error", async () => {
      const req = { userId: "u1", body: { category: "Food", limit: 100, month: "2026-01" } } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.budget.create.mockRejectedValueOnce(new Error("Error"));
      await createBudget(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("updateBudget", () => {
    it("should return 404 if not found", async () => {
      const req = { userId: "u1", params: { id: "b1" }, body: { limit: 200 } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.budget.findFirst.mockResolvedValue(null);
      await updateBudget(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update budget", async () => {
      const req = { userId: "u1", params: { id: "b1" }, body: { limit: 200 } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.budget.findFirst.mockResolvedValue({ id: "b1" });
      prismaMock.budget.update.mockResolvedValue({ id: "b1", limit: 200 });
      await updateBudget(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: "b1", limit: 200 });
    });

    it("should handle error", async () => {
      const req = { userId: "u1", params: { id: "b1" }, body: { limit: 200 } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.budget.findFirst.mockResolvedValue({ id: "b1" });
      prismaMock.budget.update.mockRejectedValueOnce(new Error("Error"));
      await updateBudget(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteBudget", () => {
    it("should return 404 if not found", async () => {
      const req = { userId: "u1", params: { id: "b1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.budget.findFirst.mockResolvedValue(null);
      await deleteBudget(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete budget", async () => {
      const req = { userId: "u1", params: { id: "b1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.budget.findFirst.mockResolvedValue({ id: "b1" });
      await deleteBudget(req, res);
      expect(prismaMock.budget.delete).toHaveBeenCalledWith({ where: { id: "b1" } });
      expect(res.json).toHaveBeenCalledWith({ message: "Orçamento removido com sucesso." });
    });

    it("should handle error", async () => {
      const req = { userId: "u1", params: { id: "b1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.budget.findFirst.mockResolvedValue({ id: "b1" });
      prismaMock.budget.delete.mockRejectedValueOnce(new Error("Error"));
      await deleteBudget(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

