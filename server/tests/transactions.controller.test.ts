import { describe, it, expect, vi, beforeEach } from "vitest";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction } from "../src/controllers/transactions.controller";
import { prismaMock } from "./helpers";
import { AuthenticatedRequest } from "../src/middlewares/auth";
import { Response } from "express";


const mockRes = () => {
  const res: Partial<Response> = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res as Response;
};

describe("Transactions Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getTransactions", () => {
    it("should list transactions", async () => {
      const req = { userId: "user1" } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.transaction.findMany.mockResolvedValue([{ id: "tx1", amount: 10 }]);

      await getTransactions(req, res);

      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: "user1" },
        orderBy: { date: "desc" },
      });
      expect(res.json).toHaveBeenCalledWith([{ id: "tx1", amount: 10 }]);
    });
    
    it("should handle error", async () => {
      const req = { userId: "user1" } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.transaction.findMany.mockRejectedValueOnce(new Error("DB Error"));

      await getTransactions(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("createTransaction", () => {
    it("should return 400 for invalid data", async () => {
      const req = { userId: "u1", body: {} } as AuthenticatedRequest;
      const res = mockRes();
      await createTransaction(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should create a single transaction", async () => {
      const req = {
        userId: "u1",
        body: {
          amount: 50, type: "income", category: "Salary", description: "Test",
          date: "2026-01-01", paymentMethod: "CASH", account: "Main",
          recurrenceType: "NONE", isPaid: true
        }
      } as AuthenticatedRequest;
      const res = mockRes();

      const createdTx = { id: "t1", amount: 50, type: "income", account: "Main", isPaid: true };
      prismaMock.transaction.create.mockResolvedValue(createdTx);
      prismaMock.account.findFirst.mockResolvedValue({ id: "acc1", balance: 100 });

      await createTransaction(req, res);

      expect(prismaMock.transaction.create).toHaveBeenCalledTimes(1);
      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { id: "acc1" },
        data: { balance: 150 }
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(createdTx);
    });

    it("should handle error", async () => {
      const req = { userId: "user1", body: {
          amount: 50, type: "income", category: "Salary", description: "Test",
          date: "2026-01-01", paymentMethod: "CASH", account: "Main"
      } } as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.$transaction.mockRejectedValueOnce(new Error("DB Error"));

      await createTransaction(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("updateTransaction", () => {
    it("should return 404 if not found", async () => {
      const req = { userId: "u1", params: { id: "t1" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.transaction.findFirst.mockResolvedValue(null);
      await updateTransaction(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should update a transaction and update account balance", async () => {
      const existing = { id: "t1", amount: 50, type: "income", account: "Main", isPaid: true, userId: "u1" };
      prismaMock.transaction.findFirst.mockResolvedValue(existing);

      const req = {
        userId: "u1",
        params: { id: "t1" },
        body: { amount: 100, isPaid: true, type: "income", account: "Main" }
      } as unknown as AuthenticatedRequest;
      const res = mockRes();

      prismaMock.account.findFirst.mockResolvedValue({ id: "acc1", balance: 150 });
      prismaMock.transaction.update.mockResolvedValue({ id: "t1", amount: 100, type: "income", account: "Main", isPaid: true });

      await updateTransaction(req, res);

      // It should revert the old balance (150 - 50 = 100) and apply the new (100 + 100 = 200)
      // Actually the mock returns 150 every time, so it will update to 150 - 50 = 100, then 150 + 100 = 250.
      expect(prismaMock.account.update).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalled();
    });

    it("should return 400 for invalid data", async () => {
      const req = { userId: "u1", params: { id: "t1" }, body: { amount: "wrong" } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.transaction.findFirst.mockResolvedValue({ id: "t1" });
      await updateTransaction(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it("should handle error", async () => {
      const req = { userId: "u1", params: { id: "t1" }, body: { amount: 100 } } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.transaction.findFirst.mockResolvedValue({ id: "t1" });
      prismaMock.$transaction.mockRejectedValueOnce(new Error("Error"));
      await updateTransaction(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe("deleteTransaction", () => {
    it("should return 404 if not found", async () => {
      const req = { userId: "u1", params: { id: "t1" }, query: {} } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.transaction.findFirst.mockResolvedValue(null);
      await deleteTransaction(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it("should delete simple transaction and revert balance", async () => {
      const existing = { id: "t1", amount: 50, type: "income", account: "Main", isPaid: true, userId: "u1", date: "2026-01-01" };
      prismaMock.transaction.findFirst.mockResolvedValue(existing);
      prismaMock.account.findFirst.mockResolvedValue({ id: "acc1", balance: 150 });

      const req = { userId: "u1", params: { id: "t1" }, query: {} } as unknown as AuthenticatedRequest;
      const res = mockRes();

      await deleteTransaction(req, res);

      expect(prismaMock.account.update).toHaveBeenCalledWith({
        where: { id: "acc1" },
        data: { balance: 100 }
      });
      expect(prismaMock.transaction.delete).toHaveBeenCalledWith({ where: { id: "t1" } });
      expect(res.json).toHaveBeenCalledWith({ message: "Transação removida com sucesso." });
    });

    it("should delete all future transactions", async () => {
      const existing = { id: "t1", amount: 50, type: "income", account: "Main", isPaid: false, userId: "u1", date: "2026-01-01", recurrenceGroupId: "g1" };
      prismaMock.transaction.findFirst.mockResolvedValue(existing);
      
      const req = { userId: "u1", params: { id: "t1" }, query: { deleteAllFuture: "true" } } as unknown as AuthenticatedRequest;
      const res = mockRes();

      prismaMock.transaction.findMany.mockResolvedValue([existing, { ...existing, id: "t2", date: "2026-02-01" }]);

      await deleteTransaction(req, res);

      expect(prismaMock.transaction.findMany).toHaveBeenCalled();
      expect(prismaMock.transaction.delete).toHaveBeenCalledTimes(2);
    });

    it("should handle error", async () => {
      const req = { userId: "u1", params: { id: "t1" }, query: {} } as unknown as AuthenticatedRequest;
      const res = mockRes();
      prismaMock.transaction.findFirst.mockResolvedValue({ id: "t1" });
      prismaMock.$transaction.mockRejectedValueOnce(new Error("Error"));
      await deleteTransaction(req, res);
      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});
