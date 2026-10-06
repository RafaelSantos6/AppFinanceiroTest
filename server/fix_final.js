const fs = require('fs');

let helpers = fs.readFileSync('tests/helpers.ts', 'utf8');
helpers = helpers.replace(/category: \{/, 'category: {\n    createMany: vi.fn(),');
fs.writeFileSync('tests/helpers.ts', helpers);

let auth = fs.readFileSync('tests/auth.controller.test.ts', 'utf8');
auth = auth.replace(/user: \{ id: "1", email: "x@x.com", name: "Test", avatarUrl: null \},\n\s+token: "token123"/, 'message: "Login efetuado com sucesso!",\n        user: { id: "1", email: "x@x.com", name: "Test", avatarUrl: null },\n        token: "token123"');
fs.writeFileSync('tests/auth.controller.test.ts', auth);

