import { Response } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../prisma";
import { AuthenticatedRequest } from "../middlewares/auth";
import { defaultCategoriesData } from "./auth.controller";

const createChildSchema = z.object({
  name: z.string().trim().min(2, "Nome da criança deve ter pelo menos 2 caracteres"),
  email: z.string().trim().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  spendingLimit: z.number().positive("Limite de gastos deve ser maior que zero").optional().nullable(),
  initialBalance: z.number().min(0, "Saldo inicial não pode ser negativo").optional().default(0),
});

const updateChildSchema = z.object({
  name: z.string().trim().min(2, "Nome da criança deve ter pelo menos 2 caracteres").optional(),
  spendingLimit: z.number().positive("Limite de gastos deve ser maior que zero").optional().nullable(),
});

export async function createChildAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parentId = req.userId!;

    // Verifica se o usuário autenticado é um titular (ADULT) e não uma conta de criança
    const parentUser = await prisma.user.findUnique({
      where: { id: parentId },
      select: { id: true, role: true },
    });

    if (!parentUser) {
      res.status(404).json({ message: "Usuário titular não encontrado." });
      return;
    }

    if (parentUser.role === "CHILD") {
      res.status(403).json({
        message: "Contas de dependentes não têm permissão para criar outras subcontas.",
      });
      return;
    }

    const parsed = createChildSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: parsed.error.errors[0]?.message || "Dados inválidos para criar conta da criança.",
      });
      return;
    }

    const { name, email, password, spendingLimit, initialBalance } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(409).json({ message: "Já existe uma conta cadastrada com este e-mail." });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const child = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "CHILD",
        parentId,
        spendingLimit: spendingLimit ?? null,
        accounts: {
          create: [
            { name: "Carteira / Mesada", type: "cash", balance: initialBalance ?? 0 },
          ],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        parentId: true,
        spendingLimit: true,
        createdAt: true,
      },
    });

    await prisma.category.createMany({
      data: defaultCategoriesData.map((cat) => ({ ...cat, userId: child.id })),
      skipDuplicates: true,
    });

    res.status(201).json({
      child,
      message: "Conta da criança criada com sucesso!",
    });
  } catch (error) {
    console.error("Erro ao criar conta da criança:", error);
    res.status(500).json({ message: "Erro interno ao criar conta da criança." });
  }
}

export async function getChildren(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parentId = req.userId!;

    const children = await prisma.user.findMany({
      where: { parentId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        parentId: true,
        spendingLimit: true,
        createdAt: true,
        accounts: {
          select: { id: true, name: true, type: true, balance: true },
        },
        transactions: {
          select: { id: true, amount: true, type: true, category: true, date: true, description: true },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const summaries = children.map((child) => {
      const totalBalance = (child.accounts || []).reduce((sum, acc) => sum + acc.balance, 0);
      const totalExpenses = (child.transactions || [])
        .filter((tx) => tx.type === "expense")
        .reduce((sum, tx) => sum + tx.amount, 0);
      const totalIncome = (child.transactions || [])
        .filter((tx) => tx.type === "income")
        .reduce((sum, tx) => sum + tx.amount, 0);

      return {
        id: child.id,
        name: child.name,
        email: child.email,
        role: child.role,
        parentId: child.parentId,
        spendingLimit: child.spendingLimit,
        createdAt: child.createdAt,
        totalBalance,
        totalExpenses,
        totalIncome,
        transactionCount: (child.transactions || []).length,
      };
    });

    res.json(summaries);
  } catch (error) {
    console.error("Erro ao listar contas de crianças:", error);
    res.status(500).json({ message: "Erro ao buscar contas vinculadas." });
  }
}

export async function getChildOverview(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parentId = req.userId!;
    const { childId } = req.params;

    // Prevenção de IDOR: exige que o registro tenha id === childId E parentId === req.userId
    const child = await prisma.user.findFirst({
      where: {
        id: childId,
        parentId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        parentId: true,
        spendingLimit: true,
        createdAt: true,
        accounts: {
          orderBy: { createdAt: "asc" },
        },
        transactions: {
          orderBy: { date: "desc" },
        },
        categories: {
          orderBy: { name: "asc" },
        },
        goals: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!child) {
      res.status(404).json({
        message: "Conta de dependente não encontrada ou sem permissão de visualização.",
      });
      return;
    }

    const totalBalance = (child.accounts || []).reduce((sum, acc) => sum + acc.balance, 0);
    const expenses = (child.transactions || []).filter((tx) => tx.type === "expense");
    const incomes = (child.transactions || []).filter((tx) => tx.type === "income");

    const totalExpenses = expenses.reduce((sum, tx) => sum + tx.amount, 0);
    const totalIncome = incomes.reduce((sum, tx) => sum + tx.amount, 0);

    const categoryMap = new Map<string, number>();
    for (const tx of expenses) {
      categoryMap.set(tx.category, (categoryMap.get(tx.category) || 0) + tx.amount);
    }

    const spendingByCategory = Array.from(categoryMap.entries()).map(([category, amount]) => {
      const matchedCat = (child.categories || []).find((c) => c.name === category);
      return {
        category,
        amount,
        icon: matchedCat?.icon || "🏷️",
        color: matchedCat?.color || "hsl(221, 83%, 53%)",
      };
    });

    res.json({
      child: {
        id: child.id,
        name: child.name,
        email: child.email,
        role: child.role,
        parentId: child.parentId,
        spendingLimit: child.spendingLimit,
        createdAt: child.createdAt,
      },
      totalBalance,
      totalExpenses,
      totalIncome,
      accounts: child.accounts || [],
      transactions: child.transactions || [],
      goals: child.goals || [],
      spendingByCategory,
    });
  } catch (error) {
    console.error("Erro ao obter visão detalhada da criança:", error);
    res.status(500).json({ message: "Erro ao carregar gastos da criança." });
  }
}

export async function updateChildAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parentId = req.userId!;
    const { childId } = req.params;

    const existing = await prisma.user.findFirst({
      where: { id: childId, parentId },
    });

    if (!existing) {
      res.status(404).json({ message: "Conta de dependente não encontrada." });
      return;
    }

    const parsed = updateChildSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        message: parsed.error.errors[0]?.message || "Dados inválidos.",
      });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: childId },
      data: parsed.data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        parentId: true,
        spendingLimit: true,
      },
    });

    res.json(updated);
  } catch (error) {
    console.error("Erro ao atualizar conta da criança:", error);
    res.status(500).json({ message: "Erro ao atualizar conta da criança." });
  }
}

export async function deleteChildAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const parentId = req.userId!;
    const { childId } = req.params;

    const existing = await prisma.user.findFirst({
      where: { id: childId, parentId },
    });

    if (!existing) {
      res.status(404).json({ message: "Conta de dependente não encontrada." });
      return;
    }

    await prisma.user.delete({
      where: { id: childId },
    });

    res.json({ message: "Conta da criança removida com sucesso." });
  } catch (error) {
    console.error("Erro ao remover conta da criança:", error);
    res.status(500).json({ message: "Erro ao remover conta da criança." });
  }
}
