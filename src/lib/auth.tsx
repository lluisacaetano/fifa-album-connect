import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User as FirebaseUser,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ensureUserLocation, geocodeCity } from "@/lib/profile";

export type User = { uid: string; name: string; email: string; city?: string; photo?: string };
export type AuthMode = "login" | "signup";

type RegisterData = { name: string; email: string; city?: string; password: string };

type AuthContextValue = {
  user: User | null;
  hydrated: boolean;
  needsCity: boolean; // logado (ex.: Google) mas sem cidade definida
  register: (data: RegisterData) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  updateProfileData: (data: { name: string; city: string; photo?: string }) => Promise<void>;
  logout: () => Promise<void>;
  editOpen: boolean;
  openEdit: () => void;
  closeEdit: () => void;
  authOpen: boolean;
  authMode: AuthMode;
  openAuth: (mode?: AuthMode) => void;
  closeAuth: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

// Lê o perfil extra (cidade) salvo no Firestore — não falha se ainda não houver banco.
async function loadProfile(fbUser: FirebaseUser): Promise<User> {
  const base: User = {
    uid: fbUser.uid,
    name: fbUser.displayName || (fbUser.email ? fbUser.email.split("@")[0] : "Colecionador"),
    email: fbUser.email ?? "",
    photo: fbUser.photoURL ?? undefined,
  };
  try {
    const snap = await getDoc(doc(db, "users", fbUser.uid));
    if (snap.exists()) {
      const data = snap.data() as Partial<User> & { lat?: number; lng?: number };
      // Preenche as coordenadas de quem se cadastrou antes do mapa real (best-effort).
      if (data.city && typeof data.lat !== "number") void ensureUserLocation(fbUser.uid, data.city);
      return { ...base, city: data.city, name: data.name || base.name, photo: data.photo ?? fbUser.photoURL ?? undefined };
    }
  } catch {
    /* Firestore pode não estar habilitado ainda — ignora */
  }
  return base;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [editOpen, setEditOpen] = useState(false);

  // Observa a sessão do Firebase (mantém logado entre recarregamentos).
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setUser(fbUser ? await loadProfile(fbUser) : null);
      setHydrated(true);
    });
    return unsub;
  }, []);

  const register = async ({ name, email, city, password }: RegisterData) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    // Geocodifica a cidade e guarda o perfil + coordenadas no Firestore — best-effort.
    try {
      const loc = city ? await geocodeCity(city) : null;
      await setDoc(doc(db, "users", cred.user.uid), {
        name,
        email,
        city: city ?? null,
        lat: loc?.lat ?? null,
        lng: loc?.lng ?? null,
        createdAt: Date.now(),
      });
    } catch {
      /* sem Firestore ainda — segue logado mesmo assim */
    }
    setUser({ uid: cred.user.uid, name, email, city });
    setAuthOpen(false);
  };

  const login = async (email: string, password: string) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    setUser(await loadProfile(cred.user));
    setAuthOpen(false);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    // Cria/atualiza o perfil no Firestore — best-effort.
    try {
      await setDoc(
        doc(db, "users", cred.user.uid),
        { name: cred.user.displayName ?? "", email: cred.user.email ?? "", photo: cred.user.photoURL ?? null },
        { merge: true },
      );
    } catch {
      /* sem Firestore ainda — segue logado mesmo assim */
    }
    setUser(await loadProfile(cred.user));
    setAuthOpen(false);
  };

  const updateProfileData = async ({ name, city, photo }: { name: string; city: string; photo?: string }) => {
    const current = auth.currentUser;
    if (!current) return;
    await updateProfile(current, { displayName: name });
    const loc = city ? await geocodeCity(city) : null;
    try {
      const patch: Record<string, unknown> = { name, city, lat: loc?.lat ?? null, lng: loc?.lng ?? null };
      if (photo !== undefined) patch.photo = photo;
      await setDoc(doc(db, "users", current.uid), patch, { merge: true });
    } catch {
      /* ignora */
    }
    setUser((u) => (u ? { ...u, name, city, ...(photo !== undefined ? { photo } : {}) } : u));
    setEditOpen(false);
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        hydrated,
        needsCity: hydrated && !!user && !user.city,
        register,
        login,
        loginWithGoogle,
        updateProfileData,
        logout,
        authOpen,
        authMode,
        openAuth: (mode: AuthMode = "login") => {
          setAuthMode(mode);
          setAuthOpen(true);
        },
        closeAuth: () => setAuthOpen(false),
        editOpen,
        openEdit: () => setEditOpen(true),
        closeEdit: () => setEditOpen(false),
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

// Traduz os erros do Firebase Auth para mensagens amigáveis.
export function authErrorMessage(code: string): string {
  switch (code) {
    case "auth/email-already-in-use":
      return "Esse e-mail já tem conta. Tente entrar.";
    case "auth/invalid-email":
      return "E-mail inválido.";
    case "auth/weak-password":
      return "Senha fraca — use pelo menos 6 caracteres.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "E-mail ou senha incorretos.";
    case "auth/too-many-requests":
      return "Muitas tentativas. Aguarde um pouco e tente de novo.";
    case "auth/operation-not-allowed":
      return "Login por e-mail/senha não está ativado no Firebase (Authentication → Sign-in method).";
    case "auth/network-request-failed":
      return "Falha de conexão. Verifique sua internet.";
    default:
      return "Não foi possível concluir. Tente novamente.";
  }
}
