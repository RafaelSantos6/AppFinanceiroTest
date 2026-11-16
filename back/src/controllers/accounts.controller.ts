import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { prisma } from "../prisma";
import { z } from "zod";

const accountSchema = z.object({
  name: z.string().min(1, "Nome da conta é obrigatório"),
  type: z.enum(["bank", "cash", "credit", "savings"]),
  balance: z.number().default(0),
});

export async function getAccounts(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    res.json(accounts);
  } catch (error) {
    console.error("Erro ao listar contas:", error);
    res.status(500).json({ message: "Erro ao buscar contas." });
  }
}

export async function createAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const parsed = accountSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0]?.message || "Dados inválidos." });
      return;
    }

    const account = await prisma.account.create({
      data: {
        ...parsed.data,
        userId,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    console.error("Erro ao criar conta:", error);
    res.status(500).json({ message: "Erro ao criar conta." });
  }
}

export async function updateAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ message: "Conta não encontrada." });
      return;
    }

    const updated = await prisma.account.update({
      where: { id },
      data: req.body,
    });

    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar conta:", error);
    res.status(500).json({ message: "Erro ao atualizar conta." });
  }
}

export async function deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.account.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ message: "Conta não encontrada." });
      return;
    }

    await prisma.account.delete({
      where: { id },
    });

    res.json({ message: "Conta removida com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar conta:", error);
    res.status(500).json({ message: "Erro ao deletar conta." });
  }
}
