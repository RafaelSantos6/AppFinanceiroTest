import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { prisma } from "../prisma";
import { z } from "zod";

const transactionSchema = z.object({
  amount: z.number(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  paymentMethod: z.string().min(1),
  account: z.string().min(1),
});

export async function getTransactions(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const transactions = await prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    res.json(transactions);
  } catch (error) {
    console.error("Erro ao listar transações:", error);
    res.status(500).json({ message: "Erro ao buscar transações." });
  }
}

export async function createTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const parsed = transactionSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0]?.message || "Dados inválidos." });
      return;
    }

    const data = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: { ...data, userId },
      });

      const matchingAccount = await tx.account.findFirst({
        where: { userId, name: data.account },
      });

      if (matchingAccount) {
        const balanceDelta = data.type === "income" ? data.amount : -data.amount;
        await tx.account.update({
          where: { id: matchingAccount.id },
          data: { balance: matchingAccount.balance + balanceDelta },
        });
      }

      return transaction;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Erro ao criar transação:", error);
    res.status(500).json({ message: "Erro ao criar transação." });
  }
}

export async function updateTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ message: "Transação não encontrada." });
      return;
    }

    const parsed = transactionSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: "Dados inválidos." });
      return;
    }
    const data = parsed.data;

    const result = await prisma.$transaction(async (tx) => {
      // Reverter saldo da conta antiga
      const oldAccount = await tx.account.findFirst({
        where: { userId, name: existing.account },
      });
      if (oldAccount) {
        const revertDelta = existing.type === "income" ? -existing.amount : existing.amount;
        await tx.account.update({
          where: { id: oldAccount.id },
          data: { balance: oldAccount.balance + revertDelta },
        });
      }

      // Atualizar transação
      const updatedTx = await tx.transaction.update({
        where: { id },
        data,
      });

      // Aplicar novo saldo na conta (pode ser a mesma ou uma nova)
      const newAccount = await tx.account.findFirst({
        where: { userId, name: updatedTx.account },
      });
      if (newAccount) {
        const applyDelta = updatedTx.type === "income" ? updatedTx.amount : -updatedTx.amount;
        await tx.account.update({
          where: { id: newAccount.id },
          data: { balance: newAccount.balance + applyDelta },
        });
      }

      return updatedTx;
    });

    res.json(result);
  } catch (error) {
    console.error("Erro ao atualizar transação:", error);
    res.status(500).json({ message: "Erro ao atualizar transação." });
  }
}

export async function deleteTransaction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ message: "Transação não encontrada." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      // Reverter saldo da conta
      const account = await tx.account.findFirst({
        where: { userId, name: existing.account },
      });
      if (account) {
        const revertDelta = existing.type === "income" ? -existing.amount : existing.amount;
        await tx.account.update({
          where: { id: account.id },
          data: { balance: account.balance + revertDelta },
        });
      }

      await tx.transaction.delete({
        where: { id },
      });
    });

    res.json({ message: "Transação removida com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar transação:", error);
    res.status(500).json({ message: "Erro ao deletar transação." });
  }
}
