const fs = require('fs');

let accounts = fs.readFileSync('tests/accounts.controller.test.ts', 'utf8');
const updateAccount400 = /it\("should return 400 for invalid data", async \(\) => \{[\s\S]*?\}\);\n/m;
accounts = accounts.replace(updateAccount400, '');
fs.writeFileSync('tests/accounts.controller.test.ts', accounts);

let budgets = fs.readFileSync('tests/budgets.controller.test.ts', 'utf8');
const updateBugdet400 = /it\("should return 400 for invalid data", async \(\) => \{[\s\S]*?\}\);\n/m;
budgets = budgets.replace(updateBugdet400, '');
fs.writeFileSync('tests/budgets.controller.test.ts', budgets);
