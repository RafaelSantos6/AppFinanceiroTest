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

    const transaction = await prisma.transaction.create({
      data: {
        ...parsed.data,
        userId,
      },
    });

    // Atualiza saldo da conta associada se existir
    const matchingAccount = await prisma.account.findFirst({
      where: { userId, name: parsed.data.account },
    });

    if (matchingAccount) {
      const balanceDelta = parsed.data.type === "income" ? parsed.data.amount : -parsed.data.amount;
      await prisma.account.update({
        where: { id: matchingAccount.id },
        data: { balance: matchingAccount.balance + balanceDelta },
      });
    }

    res.status(201).json(transaction);
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

    const updated = await prisma.transaction.update({
      where: { id },
      data: req.body,
    });

    res.json(updated);
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

    await prisma.transaction.delete({
      where: { id },
    });

    res.json({ message: "Transação removida com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar transação:", error);
    res.status(500).json({ message: "Erro ao deletar transação." });
  }
}
