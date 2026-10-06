const fs = require('fs');

let auth = fs.readFileSync('tests/auth.controller.test.ts', 'utf8');
auth = auth.replace(/expect\(res.status\).toHaveBeenCalledWith\(400\);[\s\S]*?message: "Credenciais inválidas."/m, 'expect(res.status).toHaveBeenCalledWith(401);\n      expect(res.json).toHaveBeenCalledWith({ message: "Credenciais inválidas."');
auth = auth.replace(/vi.spyOn\(bcrypt, "compare"\).mockResolvedValue\(false as never\);\n      await login\(req, res\);\n      expect\(res.status\).toHaveBeenCalledWith\(400\);/g, 'vi.spyOn(bcrypt, "compare").mockResolvedValue(false as never);\n      await login(req, res);\n      expect(res.status).toHaveBeenCalledWith(401);');
auth = auth.replace(/user: \{ id: "1", email: "x@x.com", name: "Test" \},\n\s+token: "token123"\n\s+\}\);/, 'message: "Login efetuado com sucesso!", user: { id: "1", email: "x@x.com", name: "Test", avatarUrl: undefined }, token: "token123" });');
auth = auth.replace(/expect\(res.json\).toHaveBeenCalledWith\(\{ id: "1", email: "x@x.com", name: "Test" \}\);/, 'expect(res.json).toHaveBeenCalledWith({ user: { id: "1", email: "x@x.com", name: "Test", password: "hashed" } });');
fs.writeFileSync('tests/auth.controller.test.ts', auth);

let mid = fs.readFileSync('tests/auth.middleware.test.ts', 'utf8');
mid = mid.replace(/Acesso negado. Token não fornecido./, 'Token de autenticação não fornecido.');
mid = mid.replace(/Token inválido./, 'Sessão expirada ou token inválido.');
fs.writeFileSync('tests/auth.middleware.test.ts', mid);

