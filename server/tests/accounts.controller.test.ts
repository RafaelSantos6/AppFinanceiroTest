import { describe, it, expect, vi, beforeEach } from "vitest";
import { getAccounts, createAccount, updateAccount, deleteAccount } from "../src/controllers/accounts.controller";
import { prismaMock } from "./helpers";
import { AuthenticatedRequest } from "../src/middlewares/auth";
import { Response } from "express";

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

describe("Accounts Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAccounts", () => {
    it("should list accounts", async () => {
      const req = { userId: "user1" } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.account.findMany.mockResolvedValue([{ id: "a1", name: "Main" }]);
      await getAccounts(req, res);
      expect(prismaMock.account.findMany).toHaveBeenCalledWith({ where: { userId: "user1" }, orderBy: { createdAt: "asc" } });
      expect(res.json).toHaveBeenCalledWith([{ id: "a1", name: "Main" }]);
    });
    
    it("should handle error", async () => {
      const req = { userId: "user1" } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.account.findMany.mockRejectedValueOnce(new Error("DB Error"));
      await getAccounts(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createAccount", () => {
    it("should create account", async () => {
      const req = { userId: "u1", body: { name: "Nu", type: "bank", balance: 100 } } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.account.create.mockResolvedValue({ id: "a1", name: "Nu" });
      await createAccount(req, res);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ id: "a1", name: "Nu" });
    });

    it("should return 400 for invalid data", async () => {
      const req = { userId: "u1", body: {} } as AuthenticatedRequest;
      const res = mockRes();
      await createAccount(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle error", async () => {
      const req = { userId: "u1", body: { name: "Nu", type: "bank", balance: 100 } } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.account.create.mockRejectedValueOnce(new Error("Error"));
      await createAccount(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("updateAccount", () => {
    it("should return 404 if not found", async () => {
      const req = { userId: "u1", params: { id: "a1" }, body: { name: "Nu" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.account.findFirst.mockResolvedValue(null);
      await updateAccount(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update account", async () => {
      const req = { userId: "u1", params: { id: "a1" }, body: { name: "Nu Updated" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.account.findFirst.mockResolvedValue({ id: "a1" });
      prismaMock.account.update.mockResolvedValue({ id: "a1", name: "Nu Updated" });
      await updateAccount(req, res);
      expect(res.json).toHaveBeenCalledWith({ id: "a1", name: "Nu Updated" });
    });

    it("should handle error", async () => {
      const req = { userId: "u1", params: { id: "a1" }, body: { name: "Nu" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.account.findFirst.mockResolvedValue({ id: "a1" });
      prismaMock.account.update.mockRejectedValueOnce(new Error("Error"));
      await updateAccount(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteAccount", () => {
    it("should return 404 if not found", async () => {
      const req = { userId: "u1", params: { id: "a1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.account.findFirst.mockResolvedValue(null);
      await deleteAccount(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete account", async () => {
      const req = { userId: "u1", params: { id: "a1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.account.findFirst.mockResolvedValue({ id: "a1" });
      await deleteAccount(req, res);
      expect(prismaMock.account.delete).toHaveBeenCalledWith({ where: { id: "a1" } });
      expect(res.json).toHaveBeenCalledWith({ message: "Conta removida com sucesso." });
    });

    it("should handle error", async () => {
      const req = { userId: "u1", params: { id: "a1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.account.findFirst.mockResolvedValue({ id: "a1" });
      prismaMock.account.delete.mockRejectedValueOnce(new Error("Error"));
      await deleteAccount(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

