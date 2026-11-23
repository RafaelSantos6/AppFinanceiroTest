const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const backDir = path.resolve(__dirname, "..");
const envPath = path.join(backDir, ".env");
const schemaPath = path.join(backDir, "prisma", "schema.prisma");

// 1. Se não existir back/.env e não houver DATABASE_URL no ambiente (ex.: novo PC clonado),
// gera um .env local seguro com SQLite e um JWT_SECRET criptográfico único por máquina.
if (!fs.existsSync(envPath) && !process.env.DATABASE_URL) {
  const randomJwtSecret = crypto.randomBytes(32).toString("hex");
  const defaultEnvContent = [
    '# Gerado automaticamente para desenvolvimento local (não versionado no Git)',
    'DATABASE_URL="file:./dev.db"',
    `JWT_SECRET="${randomJwtSecret}"`,
    "PORT=3333",
    'CORS_ORIGIN="*"',
    "",
  ].join("\n");

  fs.writeFileSync(envPath, defaultEnvContent, "utf8");
  console.log("✅ [setup-env] Arquivo back/.env criado automaticamente com JWT_SECRET seguro e banco local SQLite (file:./dev.db).");
}

// 2. Lê DATABASE_URL do ambiente ou do back/.env para alinhar o provider do Prisma (sqlite vs postgresql)
let dbUrl = process.env.DATABASE_URL || "";
if (!dbUrl && fs.existsSync(envPath)) {
  const envText = fs.readFileSync(envPath, "utf8");
  const match = envText.match(/^\s*DATABASE_URL\s*=\s*["']?([^"'\r\n]+)["']?/m);
  if (match) {
    dbUrl = match[1].trim();
  }
}

if (dbUrl && fs.existsSync(schemaPath)) {
  const isSqlite = dbUrl.startsWith("file:");
  const targetProvider = isSqlite ? "sqlite" : "postgresql";
  const schemaContent = fs.readFileSync(schemaPath, "utf8");
  const updatedSchema = schemaContent.replace(
    /provider\s*=\s*"(postgresql|sqlite)"/,
    `provider = "${targetProvider}"`
  );

  if (updatedSchema !== schemaContent) {
    fs.writeFileSync(schemaPath, updatedSchema, "utf8");
    console.log(`🔄 [setup-env] Prisma provider ajustado automaticamente para "${targetProvider}" conforme DATABASE_URL.`);
  }
}
