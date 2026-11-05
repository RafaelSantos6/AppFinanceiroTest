import { describe, it, expect, vi, beforeEach } from "vitest";
import { getGoals, createGoal, updateGoal, deleteGoal } from "../src/controllers/goals.controller";
import { prismaMock } from "./helpers";
import { AuthenticatedRequest } from "../src/middlewares/auth";
import { Response } from "express";

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

describe("Goals Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getGoals", () => {
    it("should list goals", async () => {
      const req = { userId: "user1" } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.goal.findMany.mockResolvedValue([{ id: "g1", name: "Reserva de Emergência" }]);
      await getGoals(req, res);
      expect(prismaMock.goal.findMany).toHaveBeenCalledWith({
        where: { userId: "user1" },
        orderBy: { createdAt: "asc" },
      });
      expect(res.json).toHaveBeenCalledWith([{ id: "g1", name: "Reserva de Emergência" }]);
    });

    it("should handle error", async () => {
      const req = { userId: "user1" } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.goal.findMany.mockRejectedValueOnce(new Error("DB Error"));
      await getGoals(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createGoal", () => {
    it("should create goal", async () => {
      const req = {
        userId: "u1",
        body: { name: "Viagem", targetAmount: 5000, currentAmount: 1000, icon: "✈️", color: "#2563eb" },
      } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.goal.create.mockResolvedValue({ id: "g1", name: "Viagem", targetAmount: 5000 });
      await createGoal(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: "g1", name: "Viagem", targetAmount: 5000 });
    });

    it("should return 400 for invalid data", async () => {
      const req = { userId: "u1", body: { name: "", targetAmount: -10 } } as AuthenticatedRequest;
      const res = mockRes();
      await createGoal(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle error", async () => {
      const req = {
        userId: "u1",
        body: { name: "Viagem", targetAmount: 5000 },
      } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.goal.create.mockRejectedValueOnce(new Error("Error"));
      await createGoal(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("updateGoal", () => {
    it("should return 404 if not found", async () => {
      const req = { userId: "u1", params: { id: "g1" }, body: { currentAmount: 1500 } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.goal.findFirst.mockResolvedValue(null);
      await updateGoal(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update goal", async () => {
      const req = { userId: "u1", params: { id: "g1" }, body: { currentAmount: 1500 } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.goal.findFirst.mockResolvedValue({ id: "g1" });
      prismaMock.goal.update.mockResolvedValue({ id: "g1", currentAmount: 1500 });
      await updateGoal(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: "g1", currentAmount: 1500 });
    });

    it("should handle error", async () => {
      const req = { userId: "u1", params: { id: "g1" }, body: { currentAmount: 1500 } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.goal.findFirst.mockResolvedValue({ id: "g1" });
      prismaMock.goal.update.mockRejectedValueOnce(new Error("Error"));
      await updateGoal(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteGoal", () => {
    it("should return 404 if not found", async () => {
      const req = { userId: "u1", params: { id: "g1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.goal.findFirst.mockResolvedValue(null);
      await deleteGoal(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete goal", async () => {
      const req = { userId: "u1", params: { id: "g1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.goal.findFirst.mockResolvedValue({ id: "g1" });
      await deleteGoal(req, res);
      expect(prismaMock.goal.delete).toHaveBeenCalledWith({ where: { id: "g1" } });
      expect(res.json).toHaveBeenCalledWith({ message: "Meta financeira removida com sucesso." });
    });

    it("should handle error", async () => {
      const req = { userId: "u1", params: { id: "g1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.goal.findFirst.mockResolvedValue({ id: "g1" });
      prismaMock.goal.delete.mockRejectedValueOnce(new Error("Error"));
      await deleteGoal(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
