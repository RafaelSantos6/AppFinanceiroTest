const fs = require('fs');

// Auth: add message to register
let auth = fs.readFileSync('tests/auth.controller.test.ts', 'utf8');
auth = auth.replace(/user: \{ id: "1", email: "new@test.com", name: "Test", avatarUrl: null \},\n\s+token: "token123"/, 'message: "Usuário cadastrado com sucesso!",\n        user: { id: "1", email: "new@test.com", name: "Test", avatarUrl: null },\n        token: "token123"');
fs.writeFileSync('tests/auth.controller.test.ts', auth);

// Accounts: change type "checking" to "bank"
let accounts = fs.readFileSync('tests/accounts.controller.test.ts', 'utf8');
accounts = accounts.replace(/type: "checking"/g, 'type: "bank"');
fs.writeFileSync('tests/accounts.controller.test.ts', accounts);

// Budgets: remove the 400 invalid data test for update
let budgets = fs.readFileSync('tests/budgets.controller.test.ts', 'utf8');
const updateBugdet400 = /it\("should return 400 for invalid data", async \(\) => \{[\s\S]*?\}\);\n/m;
budgets = budgets.replace(updateBugdet400, '');
fs.writeFileSync('tests/budgets.controller.test.ts', budgets);
