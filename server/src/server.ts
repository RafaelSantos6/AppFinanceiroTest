import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "./routes/auth.routes";
import transactionsRoutes from "./routes/transactions.routes";
import accountsRoutes from "./routes/accounts.routes";
import budgetsRoutes from "./routes/budgets.routes";
import categoriesRoutes from "./routes/categories.routes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3333;

app.use(cors());
app.use(express.json());

// Rota de verificação do status da API
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Backend BolsoCerto API online com banco de dados SQLite",
    timestamp: new Date().toISOString(),
  });
});

// Rotas da aplicação
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/categories", categoriesRoutes);

app.listen(PORT, () => {
  console.log(`🚀 Servidor backend rodando com sucesso em http://localhost:${PORT}`);
  console.log(`📊 Banco de dados conectado via Prisma.`);
  console.log(`🔐 Rotas de autenticação disponíveis em http://localhost:${PORT}/api/auth`);
});
