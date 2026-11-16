# 💰 BolsoCerto (AppFinanceiroTest)

Sistema web de gestão financeira pessoal (contas, transações recorrentes/parceladas, orçamentos mensais, categorias e metas financeiras), construído com arquitetura separada entre **Frontend (`front/`)** e **Backend (`back/`)**.

> Inspirado por [jacksjm/my-money-mate](https://github.com/jacksjm/my-money-mate.git).

---

## 📁 Estrutura do Repositório

```text
AppFinanceiroTest/
├── front/                 # Aplicação Web SPA (React 18 + TypeScript + Vite + Tailwind + Shadcn UI)
│   ├── src/
│   │   ├── components/    # Componentes visuais e formulários
│   │   ├── contexts/      # Contextos de Autenticação (AuthContext) e Finanças (FinanceContext)
│   │   ├── hooks/         # Hooks customizados (useFinanceData, etc.)
│   │   ├── lib/           # Cliente HTTP (api.ts), utilitários e tipos
│   │   ├── pages/         # Páginas da aplicação (Dashboard, Transactions, Accounts, Budgets, Goals, Reports)
│   │   └── test/          # Testes unitários e de integração (Vitest + Testing Library)
│   └── package.json
├── back/                  # API RESTful (Node.js + Express + TypeScript + Prisma ORM + SQLite)
│   ├── prisma/            # Schema do banco de dados (schema.prisma) e seed inicial
│   ├── src/
│   │   ├── controllers/   # Regras de negócio e validação Zod (auth, accounts, budgets, categories, goals, transactions)
│   │   ├── middlewares/   # Middleware de autenticação JWT (auth.ts)
│   │   ├── routes/        # Definição de rotas protegidas da API
│   │   ├── utils/         # Cálculos financeiros e geração de recorrências
│   │   ├── prisma.ts      # Instância singleton do Prisma Client
│   │   └── server.ts      # Configuração do Express, CORS e Headers de Segurança
│   ├── tests/             # Testes unitários dos controllers, middlewares e utilitários (Vitest)
│   └── package.json
├── vercel.json            # Configuração de build, rotas SPA e headers de segurança para deploy na Vercel
└── package.json           # Scripts unificados para execução na raiz do monorepo
```

---

## 🚀 Como Executar o Projeto

Na raiz do projeto, você pode gerenciar tanto o `front` quanto o `back`:

```bash
# Instalar dependências do frontend e backend
npm --prefix front install --legacy-peer-deps
npm --prefix back install

# Configurar banco de dados SQLite (Prisma Generate + Push + Seed)
npm run setup:back

# Rodar Frontend (http://localhost:8080) e Backend (http://localhost:3333) simultaneamente
npm run dev

# Executar suíte completa de testes (Front + Back)
npm run test

# Gerar build de produção
npm run build:all
```

---

## 🔐 Segurança Web e Mitigação de Vulnerabilidades

O projeto foi desenhado e revisado aplicando práticas de defesa em profundidade (*Defense in Depth*) nas camadas de **versionamento**, **transporte HTTP**, **autenticação/sessão**, **validação de entrada** e **acesso a dados**. Abaixo está o detalhamento de como cada vulnerabilidade foi mitigada e onde foi aplicada no código:

---

### 1. Proteção de Segredos e `.gitignore`

- **Risco**: Vazamento acidental de chaves privadas (`JWT_SECRET`), credenciais de banco de dados (`DATABASE_URL`), arquivos de banco SQLite locais (`.db` com dados de usuários) ou artefatos de build no histórico do Git.
- **Como foi mitigado e aplicado no código**:
  - O arquivo [`.gitignore`](./.gitignore) bloqueia explicitamente qualquer arquivo de ambiente (`.env`, `.env.*`, `back/.env`, `front/.env`), permitindo apenas os templates seguros (`!.env.example`, `!back/.env.example`, `!front/.env.example`).
  - Bancos de dados SQLite e seus arquivos de journal/WAL (`back/prisma/*.db`, `*.db-journal`, `*.db-shm`, `*.db-wal`, `*.sqlite`, `*.sqlite3`) e chaves criptográficas (`*.pem`, `*.key`, `*.crt`, `*.p12`) são bloqueados no versionamento.
  - Arquivos de exemplo ([`front/.env.example`](./front/.env.example) e [`back/.env.example`](./back/.env.example)) documentam as variáveis necessárias sem expor segredos reais.

---

### 2. Hardcoded SQL (Uso de ORM em vez de SQL concatenado)

- **Risco**: Consultas SQL escritas manualmente e espalhadas pelos controllers dificultam manutenção, auditoria de tipos e frequentemente levam a concatenação insegura de strings.
- **Como foi mitigado e aplicado no código**:
  - **Nenhuma query SQL bruta (`$queryRawUnsafe` ou strings `SELECT/INSERT/UPDATE`) é utilizada no código.**
  - Toda a persistência é abstraída pelo **Prisma ORM** ([`back/prisma/schema.prisma`](./back/prisma/schema.prisma) e [`back/src/prisma.ts`](./back/src/prisma.ts)), utilizando métodos fortemente tipados como `findMany`, `findFirst`, `findUnique`, `create`, `update` e `delete`.
  - Exemplo aplicado em [`back/src/controllers/accounts.controller.ts`](./back/src/controllers/accounts.controller.ts):
    ```ts
    const accounts = await prisma.account.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });
    ```

---

### 3. SQL Injection (Injeção de SQL)

- **Risco**: Inserção de comandos SQL maliciosos (ex.: `' OR '1'='1'; DROP TABLE Transaction; --`) por meio de campos de formulário, parâmetros de rota (`:id`) ou query strings.
- **Como foi mitigado e aplicado no código**:
  1. **Prepared Statements / Queries Parametrizadas pelo Prisma Engine**: O Prisma Client converte todas as chamadas (`where`, `data`) em *prepared statements* parametrizados no driver SQLite, tratando qualquer entrada do usuário estritamente como literal de dado e nunca como comando executável.
  2. **Validação Prévia de Tipos com Zod**: Antes de qualquer consulta chegar ao Prisma, o payload passa por validação de schema com `zod` (`z.string()`, `z.number()`, `z.enum()`), rejeitando objetos malformados com erro `400 Bad Request`.
  - Exemplo aplicado em [`back/src/controllers/auth.controller.ts`](./back/src/controllers/auth.controller.ts):
    ```ts
    const parseResult = loginSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ message: "E-mail e senha são obrigatórios." });
      return;
    }
    const normalizedEmail = parseResult.data.email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }, // Query parametrizada pelo Prisma
    });
    ```

---

### 4. Cross-Site Scripting — XSS

- **Risco**: Injeção de scripts maliciosos (`<script>...</script>`, `onerror=...`) em campos como descrição de transação, nome de meta ou categoria, visando executar código JavaScript no navegador da vítima.
- **Como foi mitigado e aplicado no código**:
  1. **Escape Automático no React (JSX)**: No frontend (`front/src/pages/` e `front/src/components/`), todos os dados vindos da API (descrições, nomes de contas, categorias e metas) são renderizados via expressões JSX (`{tx.description}`, `{goal.name}`), que o React escapa automaticamente no DOM (convertendo `<`, `>`, `&`, `"` e `'` em entidades seguras). Não há uso de `dangerouslySetInnerHTML` com dados de usuários.
  2. **Headers HTTP Anti-XSS no Backend e na Vercel**:
     - Em [`back/src/server.ts`](./back/src/server.ts) e [`vercel.json`](./vercel.json), são enviados os cabeçalhos:
       - `Content-Security-Policy: default-src 'self'; frame-ancestors 'none'`
       - `X-Content-Type-Options: nosniff` (impede que o navegador execute arquivos de texto/JSON como HTML/JS via MIME-sniffing)
       - `X-XSS-Protection: 1; mode=block`
       - `X-Frame-Options: DENY` (previne Clickjacking em iframes)
  3. **Higienização e Tipagem na Entrada**: Strings são higienizadas com `.trim()` e restritas a valores esperados (`z.enum(["income", "expense"])`, `z.enum(["bank", "cash", "credit", "savings"])`) nos schemas Zod do backend.

---

### 5. Cross-Site Request Forgery — CSRF

- **Risco**: Induzir o navegador autenticado do usuário, a partir de um site terceiro malicioso, a disparar requisições de transferência/criação/exclusão aproveitando o envio automático de cookies de sessão.
- **Como foi mitigado e aplicado no código**:
  1. **Autenticação Stateless via Header `Authorization: Bearer <token>` (Sem Cookies Automáticos)**:
     - A API **não utiliza cookies de sessão** (que seriam anexados automaticamente pelo navegador em requisições cross-site).
     - Em [`front/src/lib/api.ts`](./front/src/lib/api.ts), o token JWT é anexado explicitamente via JavaScript no cabeçalho customizado `Authorization: Bearer ${token}`:
       ```ts
       function getAuthHeader(): Record<string, string> {
         const token = localStorage.getItem("ledger_auth_token");
         if (token && !token.startsWith("demo-") && !token.startsWith("mock-")) {
           return { Authorization: `Bearer ${token}` };
         }
         return {};
       }
       ```
     - Um site externo malicioso não consegue ler o token de outro domínio (devido à *Same-Origin Policy*) nem definir cabeçalhos `Authorization` customizados sem passar pela verificação de preflight CORS.
  2. **Content-Type Estrito (`application/json`) e CORS Configurado**:
     - Todas as rotas de mutação (`POST`, `PUT`, `DELETE`) exigem `Content-Type: application/json`, forçando o navegador a realizar uma requisição *preflight* (`OPTIONS`) validada pelo middleware `cors` em [`back/src/server.ts`](./back/src/server.ts) (`allowedHeaders: ["Content-Type", "Authorization"]` e `origin` configurável via `CORS_ORIGIN`).

---

### 6. Mass Assignment (Atribuição em Massa)

- **Risco**: Um atacante enviar campos extras não autorizados no corpo JSON da requisição (ex.: `{"name": "Conta", "userId": "id-de-outro-usuario", "id": "uuid-forjado"}` ou `{"password": "..."}`) para sobrescrever colunas sensíveis no banco de dados.
- **Como foi mitigado e aplicado no código**:
  1. **Whitelisting Estrito com Schemas Zod (Criação e Atualização)**:
     - Em todos os controllers ([`accounts.controller.ts`](./back/src/controllers/accounts.controller.ts), [`budgets.controller.ts`](./back/src/controllers/budgets.controller.ts), [`categories.controller.ts`](./back/src/controllers/categories.controller.ts), [`goals.controller.ts`](./back/src/controllers/goals.controller.ts), [`transactions.controller.ts`](./back/src/controllers/transactions.controller.ts)), `req.body` **nunca é repassado diretamente ao Prisma**.
     - O objeto `req.body` passa por `schema.safeParse(req.body)` (ou `updateSchema.safeParse(req.body)`), que por padrão no Zod faz **strip (remoção)** de qualquer propriedade que não esteja explicitamente declarada no schema (como `id`, `userId`, `createdAt`).
     - Exemplo em [`back/src/controllers/accounts.controller.ts`](./back/src/controllers/accounts.controller.ts):
       ```ts
       const updateAccountSchema = z.object({
         name: z.string().trim().min(1, "Nome da conta é obrigatório").optional(),
         type: z.enum(["bank", "cash", "credit", "savings"]).optional(),
         balance: z.number().optional(),
       });
       // Propriedades extras como userId ou id são descartadas pelo Zod:
       const parsed = updateAccountSchema.safeParse(req.body);
       const updated = await prisma.account.update({
         where: { id },
         data: parsed.data,
       });
       ```
  2. **Vínculo de Propriedade (`userId`) Exclusivamente pelo Token JWT**:
     - O `userId` utilizado em criações e filtros vem sempre de `req.userId` (extraído e verificado criptograficamente pelo [`authMiddleware`](./back/src/middlewares/auth.ts)), ignorando qualquer `userId` enviado pelo cliente.
  3. **Projeção Explícita de Campos no Retorno (`select`)**:
     - Em [`back/src/controllers/auth.controller.ts`](./back/src/controllers/auth.controller.ts), as consultas de usuário usam `select: { id: true, name: true, email: true, avatarUrl: true }`, garantindo que o hash da senha (`password`) jamais seja retornado nas respostas da API.

---

### 7. Session Hijacking (Sequestro de Sessão)

- **Risco**: Interceptação, falsificação ou adulteração de credenciais de sessão para personificar um usuário legítimo.
- **Como foi mitigado e aplicado no código**:
  1. **Assinatura Criptográfica HMAC-SHA256 e Expiração de Token (JWT)**:
     - Os tokens de sessão são assinados com `jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "7d" })` em [`back/src/controllers/auth.controller.ts`](./back/src/controllers/auth.controller.ts). Qualquer alteração no payload do token invalida a assinatura na verificação `jwt.verify(token, JWT_SECRET)` em [`back/src/middlewares/auth.ts`](./back/src/middlewares/auth.ts).
  2. **Validação Rigorosa do Formato `Bearer` no Middleware**:
     - O [`authMiddleware`](./back/src/middlewares/auth.ts) verifica a presença do header `Authorization`, exige exatamente o esquema `Bearer <token>` e rejeita tokens expirados ou malformados com HTTP `401 Unauthorized`.
  3. **Limpeza Automática de Sessão Corrompida e Logout Seguro**:
     - Em [`front/src/contexts/AuthContext.tsx`](./front/src/contexts/AuthContext.tsx), caso os dados de sessão estejam inválidos ou o usuário execute `logout()`, tanto o estado em memória quanto as chaves `ledger_auth_token` e `ledger_auth_user` são imediatamente removidos.

---

### 8. Outras Vulnerabilidades Relevantes Mitigadas

- **Prevenção de IDOR (*Insecure Direct Object Reference*) / Controle de Acesso Horizontal**:
  - Todas as rotas de atualização (`PUT /:id`) e exclusão (`DELETE /:id`) verificam se o registro pertence ao usuário autenticado antes de modificar ou remover:
    ```ts
    const existing = await prisma.goal.findFirst({
      where: { id, userId }, // Garante que o recurso pertence ao usuário do token
    });
    if (!existing) {
      res.status(404).json({ message: "Meta financeira não encontrada." });
      return;
    }
    ```
  - Isso impede que um usuário autenticado altere ou apague contas, transações, orçamentos ou metas de outro usuário apenas adivinhando o UUID.
- **Hashing Seguro de Senhas (`bcryptjs`) e Prevenção de Enumeração de Usuários**:
  - Senhas nunca são salvas em texto puro; utiliza-se `bcrypt.hash(password, 10)` (10 rounds de *salt*) no cadastro e `bcrypt.compare()` no login ([`back/src/controllers/auth.controller.ts`](./back/src/controllers/auth.controller.ts)).
  - No login, tanto para e-mail inexistente quanto para senha incorreta, a API retorna a mesma mensagem genérica (`"E-mail ou senha incorretos."` com status `401`), dificultando ataques de enumeração de contas.
- **Limitação de Payload (Prevenção de DoS) e Ocultação de Stack**:
  - Em [`back/src/server.ts`](./back/src/server.ts), `express.json({ limit: "50kb" })` bloqueia payloads JSON gigantes que poderiam exaurir memória/CPU, e `app.disable("x-powered-by")` omite a assinatura padrão do Express nos cabeçalhos HTTP.
- **Atomicidade em Operações Financeiras (Prevenção de *Race Conditions* / Estado Inconsistente)**:
  - Em [`back/src/controllers/transactions.controller.ts`](./back/src/controllers/transactions.controller.ts), a criação, edição e exclusão de transações e a respectiva atualização do saldo bancário (`account.balance`) são executadas dentro de transações atômicas do banco (`prisma.$transaction`), garantindo consistência total caso ocorra qualquer falha intermediária.
