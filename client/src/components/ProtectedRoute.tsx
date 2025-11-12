import { ReactNode } from "react";
import { Redirect } from "wouter";
import { useAuth } from "@/lib/auth";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  console.log("[PROTECTED] user:", !!user, "loading:", loading);

  if (loading) {
    console.log("[PROTECTED] Showing loading state");
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    console.log("[PROTECTED] No user, redirecting to /login");
    return <Redirect to="/login" />;
  }

  console.log("[PROTECTED] User authenticated, rendering children");
  return <>{children}</>;
}
