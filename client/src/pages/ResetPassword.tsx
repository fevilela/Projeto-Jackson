import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Activity, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "As senhas não coincidem",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/auth/reset-password", {
        token,
        newPassword,
      });

      toast({
        title: "Senha redefinida!",
        description: "Sua senha foi alterada com sucesso.",
      });

      setTimeout(() => {
        setLocation("/login");
      }, 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Código inválido ou expirado",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Activity className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Sistema de Avaliação Física</h1>
          <p className="text-muted-foreground">Redefinir Senha</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Digite o código recebido</CardTitle>
            <CardDescription>
              Insira o código de 6 dígitos enviado para seu email e escolha uma
              nova senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token">Código de recuperação</Label>
                <Input
                  id="token"
                  data-testid="input-token"
                  type="text"
                  placeholder="123456"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  required
                  maxLength={6}
                  pattern="[0-9]{6}"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="newPassword">Nova senha</Label>
                <Input
                  id="newPassword"
                  data-testid="input-new-password"
                  type="password"
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar senha</Label>
                <Input
                  id="confirmPassword"
                  data-testid="input-confirm-password"
                  type="password"
                  placeholder="Confirme sua nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? "Redefinindo..." : "Redefinir senha"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm space-y-2">
              <div>
                <Link
                  href="/forgot-password"
                  className="text-primary hover:underline"
                  data-testid="link-resend-code"
                >
                  Não recebeu o código?
                </Link>
              </div>
              <div>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  data-testid="link-back-to-login"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar para o login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
