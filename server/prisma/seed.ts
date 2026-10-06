import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // Remove categorias duplicadas (mantém apenas a mais antiga)
  console.log("Limpando categorias duplicadas no banco...");
  const allCategories = await prisma.category.findMany({
    orderBy: { createdAt: "asc" }
  });
  
  const seenCategories = new Set();
  for (const cat of allCategories) {
    const key = `${cat.userId}-${cat.name}-${cat.type}`;
    if (seenCategories.has(key)) {
      await prisma.category.delete({ where: { id: cat.id } });
    } else {
      seenCategories.add(key);
    }
  }
  console.log("Limpeza de duplicadas concluída.");

  const adminEmail = "admin@bolsocerto.com.br";
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // Limpa registros anteriores do admin se existirem
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    await prisma.user.delete({
      where: { email: adminEmail },
    });
  }

  // Cria usuário de teste com dados iniciais
  const user = await prisma.user.create({
    data: {
      name: "Rafael Ricetti",
      email: adminEmail,
      password: hashedPassword,
      accounts: {
        create: [
          { name: "Conta Corrente", type: "bank", balance: 4280.5 },
          { name: "Dinheiro", type: "cash", balance: 340.0 },
          { name: "Cartão Visa", type: "credit", balance: -1250.0 },
          { name: "Poupança", type: "savings", balance: 12500.0 },
        ],
      },
      budgets: {
        create: [
          { category: "Alimentação", limit: 400, spent: 127.9 },
          { category: "Transporte", limit: 200, spent: 100.0 },
          { category: "Moradia", limit: 1300, spent: 1200.0 },
          { category: "Entretenimento", limit: 100, spent: 29.99 },
          { category: "Saúde", limit: 150, spent: 120.0 },
          { category: "Compras", limit: 200, spent: 65.0 },
          { category: "Contas", limit: 200, spent: 150.0 },
        ],
      },
      transactions: {
        create: [
          { amount: 5200, type: "income", category: "Salário", description: "Salário de março", date: "2026-03-01", paymentMethod: "Transferência", account: "Conta Corrente" },
          { amount: 85.4, type: "expense", category: "Alimentação", description: "Compras da semana", date: "2026-03-15", paymentMethod: "Débito", account: "Conta Corrente" },
          { amount: 45.0, type: "expense", category: "Transporte", description: "Posto de gasolina", date: "2026-03-14", paymentMethod: "Crédito", account: "Cartão Visa" },
          { amount: 1200.0, type: "expense", category: "Moradia", description: "Aluguel", date: "2026-03-01", paymentMethod: "Transferência", account: "Conta Corrente" },
          { amount: 29.99, type: "expense", category: "Entretenimento", description: "Assinaturas streaming", date: "2026-03-10", paymentMethod: "Crédito", account: "Cartão Visa" },
          { amount: 120.0, type: "expense", category: "Saúde", description: "Academia", date: "2026-03-05", paymentMethod: "Débito", account: "Conta Corrente" },
          { amount: 65.0, type: "expense", category: "Compras", description: "Fone de ouvido", date: "2026-03-12", paymentMethod: "Dinheiro", account: "Dinheiro" },
          { amount: 800.0, type: "income", category: "Freelance", description: "Projeto de design", date: "2026-03-08", paymentMethod: "Transferência", account: "Conta Corrente" },
          { amount: 42.5, type: "expense", category: "Alimentação", description: "Jantar restaurante", date: "2026-03-16", paymentMethod: "Crédito", account: "Cartão Visa" },
          { amount: 150.0, type: "expense", category: "Contas", description: "Conta de luz", date: "2026-03-03", paymentMethod: "Transferência", account: "Conta Corrente" },
          { amount: 55.0, type: "expense", category: "Transporte", description: "Passe mensal", date: "2026-03-02", paymentMethod: "Débito", account: "Conta Corrente" },
          { amount: 200.0, type: "income", category: "Investimentos", description: "Dividendos", date: "2026-03-15", paymentMethod: "Transferência", account: "Poupança" },
        ],
      },
    },
  });

  await prisma.category.createMany({
    data: [
      { userId: user.id, name: "Alimentação", icon: "🍽️", color: "hsl(25, 95%, 53%)", type: "expense" },
      { userId: user.id, name: "Transporte", icon: "🚗", color: "hsl(221, 83%, 53%)", type: "expense" },
      { userId: user.id, name: "Moradia", icon: "🏠", color: "hsl(262, 83%, 58%)", type: "expense" },
      { userId: user.id, name: "Entretenimento", icon: "🎬", color: "hsl(330, 81%, 60%)", type: "expense" },
      { userId: user.id, name: "Saúde", icon: "💊", color: "hsl(142, 71%, 45%)", type: "expense" },
      { userId: user.id, name: "Compras", icon: "🛍️", color: "hsl(38, 92%, 50%)", type: "expense" },
      { userId: user.id, name: "Contas", icon: "⚡", color: "hsl(199, 89%, 48%)", type: "expense" },
      { userId: user.id, name: "Educação", icon: "📚", color: "hsl(47, 95%, 53%)", type: "expense" },
      { userId: user.id, name: "Salário", icon: "💰", color: "hsl(142, 71%, 45%)", type: "income" },
      { userId: user.id, name: "Freelance", icon: "💻", color: "hsl(221, 83%, 53%)", type: "income" },
      { userId: user.id, name: "Investimentos", icon: "📈", color: "hsl(262, 83%, 58%)", type: "income" },
    ],
  });

  console.log(`✅ Usuário inicial criado com sucesso: ${user.email} (senha: admin123)`);
  console.log("Banco de dados populado com dados de exemplo!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
