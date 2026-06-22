import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type User = { name: string; email: string; city?: string };
export type AuthMode = "login" | "signup";

type Account = { name: string; email: string; city?: string; password?: string };

type AuthContextValue = {
  user: User | null;
  hydrated: boolean;
  /** Define a sessão (login simulado). */
  signIn: (user: User) => void;
  /** Cria a conta (guarda localmente) e já entra. */
  register: (data: Account) => void;
  /** Procura uma conta já cadastrada pelo e-mail. */
  findAccount: (email: string) => Account | null;
  logout: () => void;
  authOpen: boolean;
  authMode: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const SESSION_KEY = "album-user";
const ACCOUNTS_KEY = "album-accounts";

function loadAccounts(): Record<string, Account> {
  try {
    return JSON.parse(localStorage.getItem(ACCOUNTS_KEY) || "{}") as Record<string, Account>;
  } catch {
    return {};
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");

  // Recupera a sessão salva no navegador (login simulado, sem backend).
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      if (saved) setUser(JSON.parse(saved) as User);
    } catch {
      /* ignora */
    }
    setHydrated(true);
  }, []);

  const signIn = (next: User) => {
    setUser(next);
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    } catch {
      /* ignora */
    }
    setAuthOpen(false);
  };

  const register = (data: Account) => {
    try {
      const all = loadAccounts();
      all[data.email.toLowerCase()] = data;
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(all));
    } catch {
      /* ignora */
    }
    signIn({ name: data.name, email: data.email, city: data.city });
  };

  const findAccount = (email: string): Account | null => loadAccounts()[email.toLowerCase()] ?? null;

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      /* ignora */
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        hydrated,
        signIn,
        register,
        findAccount,
        logout,
        authOpen,
        authMode,
        openAuth: (mode: AuthMode = "login") => {
          setAuthMode(mode);
          setAuthOpen(true);
        },
        closeAuth: () => setAuthOpen(false),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
