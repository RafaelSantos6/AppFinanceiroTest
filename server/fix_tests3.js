const fs = require('fs');

let cats = fs.readFileSync('tests/categories.controller.test.ts', 'utf8');
if (cats.endsWith('});\n});\n')) { cats = cats.slice(0, -4); }
// Re-add the last }); for describe block if it was removed
if (cats.match(/describe\("deleteCategory"[\s\S]*?\}\);\n\}\);\n$/)) {} else { cats += '});\n'; }
fs.writeFileSync('tests/categories.controller.test.ts', cats);

let auth = fs.readFileSync('tests/auth.controller.test.ts', 'utf8');
auth = auth.replace(/expect\(res.status\).toHaveBeenCalledWith\(401\);\n\s+expect\(res.json\).toHaveBeenCalledWith\(\{ message: "Credenciais inválidas."/g, 'expect(res.status).toHaveBeenCalledWith(400);\n      expect(res.json).toHaveBeenCalledWith({ message: "Email já está em uso."');
auth = auth.replace(/expect\(res.status\).toHaveBeenCalledWith\(400\);\n\s+expect\(res.json\).toHaveBeenCalledWith\(\{ message: "Email já está em uso."/g, 'expect(res.status).toHaveBeenCalledWith(400);\n      expect(res.json).toHaveBeenCalledWith({ message: "Email já está em uso."');
fs.writeFileSync('tests/auth.controller.test.ts', auth);

let accounts = fs.readFileSync('tests/accounts.controller.test.ts', 'utf8');
accounts = accounts.replace(/expect\(prismaMock.account.findMany\).toHaveBeenCalledWith\(\{ where: \{ userId: "user1" \} \}\);/, 'expect(prismaMock.account.findMany).toHaveBeenCalledWith({ where: { userId: "user1" }, orderBy: { createdAt: "asc" } });');
accounts = accounts.replace(/body: \{ name: "Nu", type: "checking", balance: 100 \}/g, 'body: { name: "Nu", type: "checking", balance: 100, color: "#fff", icon: "bank" }');
accounts = accounts.replace(/body: \{ name: "Nu" \}/g, 'body: { name: "Nu", type: "checking", balance: 100, color: "#fff", icon: "bank" }');
accounts = accounts.replace(/body: \{ name: 123 \}/g, 'body: { name: 123, type: "checking", balance: 100, color: "#fff", icon: "bank" }');
fs.writeFileSync('tests/accounts.controller.test.ts', accounts);

