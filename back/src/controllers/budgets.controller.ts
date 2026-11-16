import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { prisma } from "../prisma";
import { z } from "zod";

const budgetSchema = z.object({
  category: z.string().min(1, "Categoria é obrigatória"),
  limit: z.number().positive("Limite deve ser maior que zero"),
  spent: z.number().default(0),
});

export async function getBudgets(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const budgets = await prisma.budget.findMany({
      where: { userId },
      orderBy: { category: "asc" },
    });
    res.json(budgets);
  } catch (error) {
    console.error("Erro ao listar orçamentos:", error);
    res.status(500).json({ message: "Erro ao buscar orçamentos." });
  }
}

export async function createBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const parsed = budgetSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0]?.message || "Dados inválidos." });
      return;
    }

    const budget = await prisma.budget.create({
      data: {
        ...parsed.data,
        userId,
      },
    });

    res.status(201).json(budget);
  } catch (error) {
    console.error("Erro ao criar orçamento:", error);
    res.status(500).json({ message: "Erro ao criar orçamento." });
  }
}

export async function updateBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ message: "Orçamento não encontrado." });
      return;
    }

    const updated = await prisma.budget.update({
      where: { id },
      data: req.body,
    });

    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar orçamento:", error);
    res.status(500).json({ message: "Erro ao atualizar orçamento." });
  }
}

export async function deleteBudget(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.budget.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ message: "Orçamento não encontrado." });
      return;
    }

    await prisma.budget.delete({
      where: { id },
    });

    res.json({ message: "Orçamento removido com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar orçamento:", error);
    res.status(500).json({ message: "Erro ao deletar orçamento." });
  }
}
