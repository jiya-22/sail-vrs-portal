import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import API from "../services/api";
import type { AuthUser } from "../types";

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (employeeId: string, password: string) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function readStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem("sail_vrs_user");
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(readStoredUser);
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("sail_vrs_token")
  );

  const login = useCallback(async (employeeId: string, password: string) => {
    const { data } = await API.post<{ token: string; user: AuthUser }>(
      "/auth/login",
      { employeeId, password }
    );
    localStorage.setItem("sail_vrs_token", data.token);
    localStorage.setItem("sail_vrs_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("sail_vrs_token");
    localStorage.removeItem("sail_vrs_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
