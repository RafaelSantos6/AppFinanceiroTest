import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { prisma } from "../prisma";
import { z } from "zod";

const goalSchema = z.object({
  name: z.string().min(1, "Nome da meta é obrigatório"),
  targetAmount: z.number().positive("Valor da meta deve ser maior que zero"),
  currentAmount: z.number().min(0, "Valor atual não pode ser negativo").default(0),
  deadline: z.string().optional().nullable(),
  icon: z.string().default("🎯"),
  color: z.string().default("hsl(221, 83%, 53%)"),
});

export async function getGoals(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const goals = await prisma.goal.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    res.json(goals);
  } catch (error) {
    console.error("Erro ao listar metas financeiras:", error);
    res.status(500).json({ message: "Erro ao buscar metas financeiras." });
  }
}

export async function createGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const parsed = goalSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0]?.message || "Dados inválidos." });
      return;
    }

    const goal = await prisma.goal.create({
      data: {
        ...parsed.data,
        userId,
      },
    });

    res.status(201).json(goal);
  } catch (error) {
    console.error("Erro ao criar meta financeira:", error);
    res.status(500).json({ message: "Erro ao criar meta financeira." });
  }
}

export async function updateGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ message: "Meta financeira não encontrada." });
      return;
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: req.body,
    });

    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar meta financeira:", error);
    res.status(500).json({ message: "Erro ao atualizar meta financeira." });
  }
}

export async function deleteGoal(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.goal.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ message: "Meta financeira não encontrada." });
      return;
    }

    await prisma.goal.delete({
      where: { id },
    });

    res.json({ message: "Meta financeira removida com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar meta financeira:", error);
    res.status(500).json({ message: "Erro ao deletar meta financeira." });
  }
}
