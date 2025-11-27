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
import { Activity, User } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AthleteLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/athlete/auth/login", { email, password });
      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao seu painel.",
      });
      setLocation("/atleta");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais",
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
          <h1 className="text-3xl font-bold">Área do Atleta</h1>
          <p className="text-muted-foreground">Acesse seus dados de treino</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Login do Atleta
            </CardTitle>
            <CardDescription>
              Digite seu email e senha para acessar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  data-testid="input-athlete-email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  data-testid="input-athlete-password"
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-athlete-login"
              >
                {isLoading ? "Entrando..." : "Entrar"}
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t">
              <p className="text-center text-sm text-muted-foreground mb-3">
                Primeiro acesso ou esqueceu a senha?
              </p>
              <Link href="/atleta/solicitar-acesso">
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid="link-athlete-request-access"
                >
                  Solicitar Código de Acesso
                </Button>
              </Link>
            </div>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">É treinador? </span>
              <Link
                href="/login"
                className="text-primary hover:underline"
                data-testid="link-coach-login"
              >
                Acesse aqui
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
