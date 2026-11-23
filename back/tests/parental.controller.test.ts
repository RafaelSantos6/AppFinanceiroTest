import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  createChildAccount,
  getChildren,
  getChildOverview,
  updateChildAccount,
  deleteChildAccount,
} from "../src/controllers/parental.controller";
import { prismaMock } from "./helpers";
import { AuthenticatedRequest } from "../src/middlewares/auth";
import { Response } from "express";
import bcrypt from "bcryptjs";

const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

describe("Parental Control Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createChildAccount", () => {
    it("should create a child account linked to adult parent", async () => {
      const req = {
        userId: "parent-1",
        body: {
          name: "Lucas",
          email: "lucas@familia.com",
          password: "password123",
          spendingLimit: 200,
          initialBalance: 50,
        },
      } as unknown as AuthenticatedRequest;
      const res = mockRes();

      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: "parent-1", role: "ADULT" })
        .mockResolvedValueOnce(null);
      vi.spyOn(bcrypt, "hash").mockResolvedValue("hashed_child_pwd" as never);
      prismaMock.user.create.mockResolvedValue({
        id: "child-1",
        name: "Lucas",
        email: "lucas@familia.com",
        role: "CHILD",
        parentId: "parent-1",
        spendingLimit: 200,
      });

      await createChildAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        child: {
          id: "child-1",
          name: "Lucas",
          email: "lucas@familia.com",
          role: "CHILD",
          parentId: "parent-1",
          spendingLimit: 200,
        },
        message: "Conta da criança criada com sucesso!",
      });
    });

    it("should block a CHILD account from creating another subaccount (403)", async () => {
      const req = {
        userId: "child-1",
        body: { name: "Pedro", email: "pedro@familia.com", password: "password123" },
      } as unknown as AuthenticatedRequest;
      const res = mockRes();

      prismaMock.user.findUnique.mockResolvedValueOnce({ id: "child-1", role: "CHILD" });

      await createChildAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });

    it("should return 409 if child email already exists", async () => {
      const req = {
        userId: "parent-1",
        body: { name: "Lucas", email: "lucas@familia.com", password: "password123" },
      } as unknown as AuthenticatedRequest;
      const res = mockRes();

      prismaMock.user.findUnique
        .mockResolvedValueOnce({ id: "parent-1", role: "ADULT" })
        .mockResolvedValueOnce({ id: "existing-id" });

      await createChildAccount(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
    });
  });

  describe("getChildren", () => {
    it("should return children with calculated balances and expenses", async () => {
      const req = { userId: "parent-1" } as unknown as AuthenticatedRequest;
      const res = mockRes();

      prismaMock.user.findMany.mockResolvedValue([
        {
          id: "child-1",
          name: "Lucas",
          email: "lucas@familia.com",
          role: "CHILD",
          parentId: "parent-1",
          spendingLimit: 150,
          createdAt: new Date("2026-03-01"),
          accounts: [{ id: "acc-1", name: "Mesada", type: "cash", balance: 80 }],
          transactions: [
            { id: "tx-1", amount: 35, type: "expense", category: "Lanche", date: "2026-03-10", description: "Cantina" },
            { id: "tx-2", amount: 100, type: "income", category: "Mesada", date: "2026-03-01", description: "Mesada" },
          ],
        },
      ]);

      await getChildren(req, res);

      expect(res.json).toHaveBeenCalledWith([
        expect.objectContaining({
          id: "child-1",
          name: "Lucas",
          totalBalance: 80,
          totalExpenses: 35,
          totalIncome: 100,
          transactionCount: 2,
        }),
      ]);
    });
  });

  describe("getChildOverview", () => {
    it("should block access if child does not belong to requesting parent (Anti-IDOR 404)", async () => {
      const req = {
        userId: "parent-1",
        params: { childId: "other-parents-child" },
      } as unknown as AuthenticatedRequest;
      const res = mockRes();

      prismaMock.user.findFirst.mockResolvedValue(null);

      await getChildOverview(req, res);

      expect(prismaMock.user.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "other-parents-child", parentId: "parent-1" },
        })
      );
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should return detailed overview of child expenses and categories", async () => {
      const req = {
        userId: "parent-1",
        params: { childId: "child-1" },
      } as unknown as AuthenticatedRequest;
      const res = mockRes();

      prismaMock.user.findFirst.mockResolvedValue({
        id: "child-1",
        name: "Lucas",
        email: "lucas@familia.com",
        role: "CHILD",
        parentId: "parent-1",
        spendingLimit: 200,
        createdAt: new Date("2026-03-01"),
        accounts: [{ id: "acc-1", name: "Carteira", type: "cash", balance: 120 }],
        transactions: [
          { id: "tx-1", amount: 30, type: "expense", category: "Alimentação", date: "2026-03-12", description: "Sorvete" },
        ],
        categories: [{ id: "c-1", name: "Alimentação", icon: "🍽️", color: "hsl(25, 95%, 53%)" }],
        goals: [],
      });

      await getChildOverview(req, res);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          totalBalance: 120,
          totalExpenses: 30,
          totalIncome: 0,
          spendingByCategory: [
            { category: "Alimentação", amount: 30, icon: "🍽️", color: "hsl(25, 95%, 53%)" },
          ],
        })
      );
    });
  });

  describe("updateChildAccount & deleteChildAccount", () => {
    it("should strip unauthorized fields on update (mass assignment protection)", async () => {
      const req = {
        userId: "parent-1",
        params: { childId: "child-1" },
        body: { spendingLimit: 300, role: "ADULT", parentId: "hacker-id" },
      } as unknown as AuthenticatedRequest;
      const res = mockRes();

      prismaMock.user.findFirst.mockResolvedValue({ id: "child-1", parentId: "parent-1" });
      prismaMock.user.update.mockResolvedValue({ id: "child-1", spendingLimit: 300 });

      await updateChildAccount(req, res);

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "child-1" },
          data: { spendingLimit: 300 },
        })
      );
    });

    it("should delete child account owned by parent", async () => {
      const req = {
        userId: "parent-1",
        params: { childId: "child-1" },
      } as unknown as AuthenticatedRequest;
      const res = mockRes();

      prismaMock.user.findFirst.mockResolvedValue({ id: "child-1", parentId: "parent-1" });
      prismaMock.user.delete.mockResolvedValue({ id: "child-1" });

      await deleteChildAccount(req, res);

      expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: "child-1" } });
      expect(res.json).toHaveBeenCalledWith({ message: "Conta da criança removida com sucesso." });
    });
  });
});
