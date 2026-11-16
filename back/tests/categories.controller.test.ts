import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCategories, createCategory, deleteCategory } from "../src/controllers/categories.controller";
import { prismaMock } from "./helpers";
import { AuthenticatedRequest } from "../src/middlewares/auth";
import { Response } from "express";

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

describe("Categories Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCategories", () => {
    it("should list categories", async () => {
      const req = { userId: "user1" } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.category.findMany.mockResolvedValue([{ id: "c1", name: "Food" }]);
      await getCategories(req, res);
      expect(prismaMock.category.findMany).toHaveBeenCalledWith({ where: { userId: "user1" }, orderBy: { name: "asc" } });
      expect(res.json).toHaveBeenCalledWith([{ id: "c1", name: "Food" }]);
    });
    
    it("should handle error", async () => {
      const req = { userId: "user1" } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.category.findMany.mockRejectedValueOnce(new Error("DB Error"));
      await getCategories(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createCategory", () => {
    it("should create category", async () => {
      const req = { userId: "u1", body: { name: "Food", color: "#fff", type: "expense" } } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.category.create.mockResolvedValue({ id: "c1", name: "Food" });
      await createCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: "c1", name: "Food" });
    });

    it("should return 400 for invalid data", async () => {
      const req = { userId: "u1", body: {} } as AuthenticatedRequest;
      const res = mockRes();
      await createCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle error", async () => {
      const req = { userId: "u1", body: { name: "Food", color: "#fff", type: "expense" } } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.category.create.mockRejectedValueOnce(new Error("Error"));
      await createCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteCategory", () => {
    it("should return 404 if not found", async () => {
      const req = { userId: "u1", params: { id: "c1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.category.findFirst.mockResolvedValue(null);
      await deleteCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete category", async () => {
      const req = { userId: "u1", params: { id: "c1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.category.findFirst.mockResolvedValue({ id: "c1" });
      await deleteCategory(req, res);
      expect(prismaMock.category.delete).toHaveBeenCalledWith({ where: { id: "c1" } });
      expect(res.json).toHaveBeenCalledWith({ message: "Categoria removida com sucesso." });
    });

    it("should handle error", async () => {
      const req = { userId: "u1", params: { id: "c1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.category.findFirst.mockResolvedValue({ id: "c1" });
      prismaMock.category.delete.mockRejectedValueOnce(new Error("Error"));
      await deleteCategory(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

