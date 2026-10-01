import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loginDemo: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY_TOKEN = "ledger_auth_token";
const STORAGE_KEY_USER = "ledger_auth_user";
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3333/api";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restaura autenticação salva no localStorage
    try {
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      const savedUser = localStorage.getItem(STORAGE_KEY_USER);

      if (savedToken && savedUser) {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      }
    } catch (e) {
      console.error("Falha ao restaurar sessão de login:", e);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveAuthSession = (authData: AuthResponse) => {
    setToken(authData.token);
    setUser(authData.user);
    localStorage.setItem(STORAGE_KEY_TOKEN, authData.token);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authData.user));
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Tenta conectar à API do backend
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "E-mail ou senha incorretos.");
      }

      const data: AuthResponse = await response.json();
      saveAuthSession(data);
    } catch (err: unknown) {
      // Fallback amigável caso o backend ainda não esteja em execução:
      // se o erro for de conexão de rede, permite login com simulação para desenvolvimento
      const message = err instanceof Error ? err.message : "Erro no login";
      const isNetworkError =
        message.includes("Failed to fetch") ||
        message.includes("NetworkError") ||
        message.includes("Load failed");

      if (isNetworkError) {
        console.warn("Backend offline. Utilizando autenticação simulada para testes locais.");
        const mockUser: User = {
          id: "demo-user-1",
          name: email.split("@")[0] || "Usuário",
          email: email,
        };
        const mockData: AuthResponse = {
          user: mockUser,
          token: "mock-jwt-token-" + Date.now(),
        };
        saveAuthSession(mockData);
        return;
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao criar conta.");
      }

      const data: AuthResponse = await response.json();
      saveAuthSession(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Erro no cadastro";
      const isNetworkError =
        message.includes("Failed to fetch") ||
        message.includes("NetworkError") ||
        message.includes("Load failed");

      if (isNetworkError) {
        console.warn("Backend offline. Criando conta no armazenamento local.");
        const mockUser: User = {
          id: crypto.randomUUID(),
          name,
          email,
        };
        const mockData: AuthResponse = {
          user: mockUser,
          token: "mock-jwt-token-" + Date.now(),
        };
        saveAuthSession(mockData);
        return;
      }

      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginDemo = () => {
    const demoUser: User = {
      id: "demo-user-1",
      name: "Rafael Ricetti",
      email: "rafael@exemplo.com",
    };
    saveAuthSession({
      user: demoUser,
      token: "demo-jwt-token-ledger-os",
    });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        loginDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
