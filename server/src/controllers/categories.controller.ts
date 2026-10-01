import { Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth";
import { prisma } from "../prisma";
import { z } from "zod";

const categorySchema = z.object({
  name: z.string().min(1, "Nome da categoria é obrigatório"),
  icon: z.string().default("🏷️"),
  color: z.string().default("hsl(221, 83%, 53%)"),
  type: z.enum(["income", "expense", "both"]).default("expense"),
});

export async function getCategories(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const categories = await prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
    });
    res.json(categories);
  } catch (error) {
    console.error("Erro ao listar categorias:", error);
    res.status(500).json({ message: "Erro ao buscar categorias." });
  }
}

export async function createCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const parsed = categorySchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ message: parsed.error.errors[0]?.message || "Dados inválidos." });
      return;
    }

    const category = await prisma.category.create({
      data: {
        ...parsed.data,
        userId,
      },
    });

    res.status(201).json(category);
  } catch (error) {
    console.error("Erro ao criar categoria:", error);
    res.status(500).json({ message: "Erro ao criar categoria." });
  }
}

export async function deleteCategory(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const userId = req.userId!;
    const { id } = req.params;

    const existing = await prisma.category.findFirst({
      where: { id, userId },
    });

    if (!existing) {
      res.status(404).json({ message: "Categoria não encontrada." });
      return;
    }

    await prisma.category.delete({
      where: { id },
    });

    res.json({ message: "Categoria removida com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar categoria:", error);
    res.status(500).json({ message: "Erro ao deletar categoria." });
  }
}
