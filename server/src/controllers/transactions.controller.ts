import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { prisma } from "../prisma";
import { z } from "zod";
import crypto from "crypto";

const transactionSchema = z.object({
  amount: z.number(),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1),
  description: z.string().min(1),
  date: z.string().min(1),
  paymentMethod: z.string().min(1),
  account: z.string().min(1),
  recurrenceType: z.enum(["NONE", "FIXED", "INSTALLMENT"]).optional().default("NONE"),
  installmentTotal: z.number().int().positive().optional(),
  isPaid: z.boolean().optional().default(true),
});

function addMonths(dateStr: string, months: number): string {
  const date = new Date(`${dateStr}T12:00:00Z`);
  const d = date.getDate();
  date.setMonth(date.getMonth() + months);
  if (date.getDate() !== d) {
    date.setDate(0); // vai para o último dia do mês anterior se o dia atual for maior
  }
  return date.toISOString().split("T")[0];
}

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
      const transactionsToCreate: any[] = [];
      const recurrenceGroupId = (data.recurrenceType === "INSTALLMENT" || data.recurrenceType === "FIXED")
        ? crypto.randomUUID()
        : null;

      if (data.recurrenceType === "INSTALLMENT" && data.installmentTotal && data.installmentTotal > 1) {
        const total = data.amount;
        const n = data.installmentTotal;
        const baseAmount = Math.floor((total / n) * 100) / 100;
        const firstAmount = Math.round((total - (baseAmount * (n - 1))) * 100) / 100;

        for (let i = 0; i < n; i++) {
          transactionsToCreate.push({
            ...data,
            userId,
            amount: i === 0 ? firstAmount : baseAmount,
            date: addMonths(data.date, i),
            recurrenceGroupId,
            installmentCurrent: i + 1,
            installmentTotal: n,
            isPaid: i === 0 ? data.isPaid : false,
          });
        }
      } else if (data.recurrenceType === "FIXED") {
        for (let i = 0; i < 12; i++) {
          transactionsToCreate.push({
            ...data,
            userId,
            date: addMonths(data.date, i),
            recurrenceGroupId,
            isPaid: i === 0 ? data.isPaid : false,
          });
        }
      } else {
        transactionsToCreate.push({
          ...data,
          userId,
        });
      }

      const createdTransactions = [];
      for (const tData of transactionsToCreate) {
        const t = await tx.transaction.create({ data: tData });
        createdTransactions.push(t);

        if (t.isPaid) {
          const matchingAccount = await tx.account.findFirst({
            where: { userId, name: t.account },
          });

          if (matchingAccount) {
            const balanceDelta = t.type === "income" ? t.amount : -t.amount;
            await tx.account.update({
              where: { id: matchingAccount.id },
              data: { balance: matchingAccount.balance + balanceDelta },
            });
          }
        }
      }

      return createdTransactions[0];
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
      // Reverter saldo da conta antiga (apenas se estava pago)
      if (existing.isPaid) {
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
      }

      // Atualizar transação
      const updatedTx = await tx.transaction.update({
        where: { id },
        data,
      });

      // Aplicar novo saldo na conta (apenas se estiver pago)
      if (updatedTx.isPaid) {
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
    const { deleteAllFuture } = req.query;

    const existing = await prisma.transaction.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ message: "Transação não encontrada." });
      return;
    }

    await prisma.$transaction(async (tx) => {
      let toDelete = [existing];

      if (deleteAllFuture === "true" && existing.recurrenceGroupId) {
        const futureTxs = await tx.transaction.findMany({
          where: {
            userId,
            recurrenceGroupId: existing.recurrenceGroupId,
            date: { gte: existing.date },
          },
        });
        toDelete = futureTxs;
      }

      for (const t of toDelete) {
        if (t.isPaid) {
          const account = await tx.account.findFirst({
            where: { userId, name: t.account },
          });
          if (account) {
            const revertDelta = t.type === "income" ? -t.amount : t.amount;
            await tx.account.update({
              where: { id: account.id },
              data: { balance: account.balance + revertDelta },
            });
          }
        }

        await tx.transaction.delete({
          where: { id: t.id },
        });
      }
    });

    res.json({ message: "Transação removida com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar transação:", error);
    res.status(500).json({ message: "Erro ao deletar transação." });
  }
}
