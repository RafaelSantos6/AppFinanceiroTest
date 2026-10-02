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
const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

// Rota raiz (Health Check para o Render)
app.get("/", (req, res) => {
  res.status(200).send("API online");
});

// Rota de verificação do status da API
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "Backend Ledger Finance API online",
    timestamp: new Date().toISOString(),
  });
});

// Rotas da aplicação
app.use("/api/auth", authRoutes);
app.use("/api/transactions", transactionsRoutes);
app.use("/api/accounts", accountsRoutes);
app.use("/api/budgets", budgetsRoutes);
app.use("/api/categories", categoriesRoutes);

app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Servidor backend rodando com sucesso na porta ${PORT}`);
  console.log(`📊 Banco de dados PostgreSQL conectado.`);
  console.log(`🔐 Rotas de autenticação disponíveis em /api/auth`);
});
