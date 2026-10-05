import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../prisma";
import { AuthenticatedRequest } from "../middlewares/auth";

const JWT_SECRET = process.env.JWT_SECRET || "finance_system_super_secret_jwt_key_2026_ledger";

const registerSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

const loginSchema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

export const defaultCategoriesData = [
  { name: "Alimentação", icon: "🍽️", color: "hsl(25, 95%, 53%)", type: "expense" },
  { name: "Transporte", icon: "🚗", color: "hsl(221, 83%, 53%)", type: "expense" },
  { name: "Moradia", icon: "🏠", color: "hsl(262, 83%, 58%)", type: "expense" },
  { name: "Entretenimento", icon: "🎬", color: "hsl(330, 81%, 60%)", type: "expense" },
  { name: "Saúde", icon: "💊", color: "hsl(142, 71%, 45%)", type: "expense" },
  { name: "Compras", icon: "🛍️", color: "hsl(38, 92%, 50%)", type: "expense" },
  { name: "Contas", icon: "⚡", color: "hsl(199, 89%, 48%)", type: "expense" },
  { name: "Educação", icon: "📚", color: "hsl(47, 95%, 53%)", type: "expense" },
  { name: "Salário", icon: "💰", color: "hsl(142, 71%, 45%)", type: "income" },
  { name: "Freelance", icon: "💻", color: "hsl(221, 83%, 53%)", type: "income" },
  { name: "Investimentos", icon: "📈", color: "hsl(262, 83%, 58%)", type: "income" },
];

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = registerSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: parseResult.error.errors[0]?.message || "Dados de cadastro inválidos.",
      });
      return;
    }

    const { name, email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Verifica se já existe usuário com esse email
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      res.status(409).json({ message: "Já existe uma conta com este e-mail." });
      return;
    }

    // Criptografa a senha com bcrypt
    const hashedPassword = await bcrypt.hash(password, 10);

    // Cria o usuário no banco de dados SQLite
    const user = await prisma.user.create({
      data: {
        name,
        email: normalizedEmail,
        password: hashedPassword,
        // Cria uma conta inicial padrão
        accounts: {
          create: [
            { name: "Conta Principal", type: "bank", balance: 0 },
            { name: "Carteira (Dinheiro)", type: "cash", balance: 0 },
          ],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
      },
    });

    // Cria categorias padrão para o novo usuário de forma idempotente
    await prisma.category.createMany({
      data: defaultCategoriesData.map((cat) => ({ ...cat, userId: user.id })),
      skipDuplicates: true,
    });

    // Gera token JWT válido por 7 dias
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.status(201).json({
      user,
      token,
      message: "Usuário cadastrado com sucesso!",
    });
  } catch (error) {
    console.error("Erro no registro:", error);
    res.status(500).json({ message: "Erro interno no servidor ao registrar usuário." });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({
        message: parseResult.error.errors[0]?.message || "E-mail e senha são obrigatórios.",
      });
      return;
    }

    const { email, password } = parseResult.data;
    const normalizedEmail = email.toLowerCase().trim();

    // Busca o usuário no banco de dados
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      res.status(401).json({ message: "E-mail ou senha incorretos." });
      return;
    }

    // Compara a senha informada com o hash salvo no banco
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(401).json({ message: "E-mail ou senha incorretos." });
      return;
    }

    // Gera token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
      },
      token,
      message: "Login efetuado com sucesso!",
    });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: "Erro interno no servidor ao efetuar login." });
  }
}

export async function me(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    if (!req.userId) {
      res.status(401).json({ message: "Não autorizado." });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "Usuário não encontrado." });
      return;
    }

    res.json({ user });
  } catch (error) {
    console.error("Erro ao obter dados do usuário:", error);
    res.status(500).json({ message: "Erro ao carregar dados do usuário." });
  }
}
