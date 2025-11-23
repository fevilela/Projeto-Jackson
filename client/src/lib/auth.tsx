import { createContext, useContext, ReactNode } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { queryClient } from "./queryClient";

interface User {
  id: string;
  username: string;
  profilePhoto?: string | null;
  dashboardImage?: string | null;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  console.log("[AUTH] AuthProvider rendering");
  const [, setLocation] = useLocation();

  const { data: user, isLoading: loading } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch (error) {
        console.error("Error checking auth:", error);
        return null;
      }
    },
    retry: false,
  });

  const login = async (username: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao fazer login");
    }

    const userData = await response.json();
    queryClient.setQueryData(["/api/auth/me"], userData);
    setLocation("/");
  };

  const register = async (username: string, password: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Erro ao registrar");
    }

    const userData = await response.json();
    queryClient.setQueryData(["/api/auth/me"], userData);
    setLocation("/");
  };

  const logout = async () => {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
    queryClient.setQueryData(["/api/auth/me"], null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider
      value={{ user: user || null, loading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
