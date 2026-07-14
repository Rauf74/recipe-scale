import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { isAxiosError } from "axios";
import type { User } from "../../types";
import { apiClient } from "../../lib/api-client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (workspaceName: string, name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch current user session on load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const response = await apiClient.get<{ success: boolean; data: { user: User } }>("/api/auth/me");
        if (response.data.success) {
          setUser(response.data.data.user);
        }
      } catch (err) {
        // Per audit recommendation: distinguish 401 (real unauth) from 5xx/network (transient).
        // Only null the user on confirmed 401; otherwise keep last known user state and
        // surface a small reconnecting indicator via console warning.
        if (isAxiosError(err) && err.response?.status === 401) {
          setUser(null);
        } else {
          console.warn("[auth] session check failed (transient); keeping last user state", err);
        }
      } finally {
        setLoading(false);
      }
    };
    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ success: boolean; data: { user: User } }>("/api/auth/login", {
        email,
        password,
      });
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || "Failed to login");
    } finally {
      setLoading(false);
    }
  };

  const register = async (workspaceName: string, name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const response = await apiClient.post<{ success: boolean; data: { user: User } }>("/api/auth/register", {
        workspaceName,
        name,
        email,
        password,
      });
      if (response.data.success) {
        setUser(response.data.data.user);
      }
    } catch (err: any) {
      throw new Error(err.response?.data?.error || "Failed to register workspace");
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await apiClient.post("/api/auth/logout");
      setUser(null);
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
