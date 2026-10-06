const fs = require('fs');

let auth = fs.readFileSync('tests/auth.controller.test.ts', 'utf8');
auth = auth.replace(/"123"/g, '"123456"');
fs.writeFileSync('tests/auth.controller.test.ts', auth);

let budgets = fs.readFileSync('tests/budgets.controller.test.ts', 'utf8');
budgets = budgets.replace(/limit: "wrong"/g, 'category: "Food", limit: "wrong"');
fs.writeFileSync('tests/budgets.controller.test.ts', budgets);
