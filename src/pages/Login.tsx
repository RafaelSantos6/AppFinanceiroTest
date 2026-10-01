import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Lock,
  Mail,
  User as UserIcon,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Eye,
  EyeOff,
} from "lucide-react";

export default function Login() {
  const { login, register, loginDemo, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redireciona para o destino pretendido ou para o dashboard ("/")
  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/";

  // Se já estiver logado, redireciona
  if (isAuthenticated) {
    navigate(from, { replace: true });
  }

  // Estados de formulário para Login
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPassword, setShowLoginPassword] = useState(false);

  // Estados de formulário para Registro
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginEmail.trim() || !loginPassword.trim()) {
      toast.error("Por favor, preencha todos os campos.");
      return;
    }

    try {
      setIsLoading(true);
      await login(loginEmail, loginPassword);
      toast.success("Login efetuado com sucesso! Bem-vindo(a).");
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao efetuar login";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      toast.error("Preencha todos os campos obrigatórios.");
      return;
    }

    if (registerPassword.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (registerPassword !== registerConfirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }

    try {
      setIsLoading(true);
      await register(registerName, registerEmail, registerPassword);
      toast.success("Conta criada com sucesso! Você já está conectado.");
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro ao cadastrar usuário";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoAccess = () => {
    loginDemo();
    toast.success("Acesso rápido com conta de demonstração ativado!");
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-background">
      {/* Coluna Visual Lateral (Destaques da plataforma) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary/95 via-primary/80 to-slate-900 p-12 text-primary-foreground flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">LedgerOS</span>
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight mt-10 leading-snug">
            Domine suas finanças pessoais e alcance sua liberdade financeira.
          </h2>
          <p className="mt-4 text-white/80 text-base max-w-md">
            Gerencie contas bancárias, orçamentos mensais, controle despesas por categorias e tome
            decisões financeiras com dados precisos em tempo real.
          </p>
        </div>

        <div className="space-y-4 relative z-10 py-8">
          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-300">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Segurança e Privacidade</h4>
              <p className="text-xs text-white/75">Seus dados protegidos com criptografia moderna.</p>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-4 rounded-xl border border-white/15">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-300">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-semibold text-sm text-white">Previsões e Orçamentos</h4>
              <p className="text-xs text-white/75">Limites inteligentes para nunca sair do planejamento.</p>
            </div>
          </div>
        </div>

        <div className="text-xs text-white/60 relative z-10">
          © {new Date().getFullYear()} LedgerOS Financial Management. Todos os direitos reservados.
        </div>
      </div>

      {/* Coluna Central do Formulário */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 lg:p-12">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center lg:text-left space-y-2">
            <div className="inline-flex lg:hidden items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold tracking-tight">LedgerOS</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Acesse sua conta
            </h1>
            <p className="text-sm text-muted-foreground">
              Entre com suas credenciais ou crie uma conta para começar
            </p>
          </div>

          {/* Botão de Demonstração Rápida */}
          <div className="p-3.5 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between gap-3">
            <div className="text-xs space-y-0.5">
              <p className="font-medium text-foreground">Quer testar sem cadastrar?</p>
              <p className="text-muted-foreground">Experimente o sistema imediatamente.</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDemoAccess}
              className="text-xs font-semibold shrink-0 border-primary/30 hover:bg-primary hover:text-primary-foreground transition-all"
            >
              Entrar Demo
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>

          {/* Card com Abas de Login e Cadastro */}
          <Card className="border border-border/80 shadow-md">
            <Tabs defaultValue="login" className="w-full">
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Entrar</TabsTrigger>
                  <TabsTrigger value="register">Criar Conta</TabsTrigger>
                </TabsList>
              </CardHeader>

              {/* Aba: Entrar */}
              <TabsContent value="login">
                <form onSubmit={handleLogin}>
                  <CardContent className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="login-email">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-9"
                          value={loginEmail}
                          onChange={(e) => setLoginEmail(e.target.value)}
                          required
                          autoComplete="email"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">Senha</Label>
                        <a
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            toast.info("Para redefinir a senha, entre em contato com o suporte ou use a conta Demo.");
                          }}
                          className="text-xs text-primary hover:underline"
                        >
                          Esqueceu a senha?
                        </a>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-9 pr-9"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="flex flex-col gap-3 pt-2">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Autenticando...</span>
                        </div>
                      ) : (
                        "Acessar Painel"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>

              {/* Aba: Cadastro */}
              <TabsContent value="register">
                <form onSubmit={handleRegister}>
                  <CardContent className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="reg-name">Nome Completo</Label>
                      <div className="relative">
                        <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-name"
                          type="text"
                          placeholder="Seu nome"
                          className="pl-9"
                          value={registerName}
                          onChange={(e) => setRegisterName(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-email">E-mail</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-email"
                          type="email"
                          placeholder="seu@email.com"
                          className="pl-9"
                          value={registerEmail}
                          onChange={(e) => setRegisterEmail(e.target.value)}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-password">Senha (mínimo 6 caracteres)</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-password"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-9 pr-9"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                          className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                          tabIndex={-1}
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="reg-confirm-password">Confirmar Senha</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="reg-confirm-password"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="••••••••"
                          className="pl-9"
                          value={registerConfirmPassword}
                          onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                          required
                          minLength={6}
                        />
                      </div>
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2">
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          <span>Criando conta...</span>
                        </div>
                      ) : (
                        "Cadastrar e Começar"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
