import "dotenv/config";
import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import transactionsRoutes from "./routes/transactions.routes";
import accountsRoutes from "./routes/accounts.routes";
import budgetsRoutes from "./routes/budgets.routes";
import categoriesRoutes from "./routes/categories.routes";
import goalsRoutes from "./routes/goals.routes";
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3333;

// Oculta o cabeçalho X-Powered-By para evitar fingerprinting da stack
app.disable("x-powered-by");


// Headers de segurança HTTP (mitigação de XSS, Clickjacking e MIME-Sniffing)
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self'; frame-ancestors 'none'");
  next();
});

// Configuração de CORS e limite de tamanho do payload JSON
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json({ limit: "50kb" }));

// Rota de verificação do status da API
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Backend BolsoCerto API online com banco de dados",
    timestamp: new Date().toISOString(),
  });
});

// Rotas da aplicação
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/goals", goalsRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando com sucesso em http://localhost:${PORT}`);
  console.log(`📊 Banco de dados conectado via Prisma.`);
  console.log(`🔐 Rotas de autenticação disponíveis em http://localhost:${PORT}/api/auth`);
});

app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));
