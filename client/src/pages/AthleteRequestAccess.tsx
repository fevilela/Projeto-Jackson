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
import { Activity, Mail, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function AthleteRequestAccess() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/athlete/auth/request-reset", { email });
      setEmailSent(true);
      toast({
        title: "Código enviado!",
        description: "Verifique seu email para o código de acesso.",
      });
      setTimeout(() => {
        setLocation(`/atleta/criar-senha?email=${encodeURIComponent(email)}`);
      }, 2000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Não foi possível enviar o código",
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
          <p className="text-muted-foreground">Solicite seu código de acesso</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Solicitar Acesso
            </CardTitle>
            <CardDescription>
              Digite o email cadastrado pelo seu treinador para receber um
              código de acesso
            </CardDescription>
          </CardHeader>
          <CardContent>
            {emailSent ? (
              <div className="text-center space-y-4">
                <div className="bg-primary/10 p-4 rounded-lg">
                  <Mail className="h-12 w-12 text-primary mx-auto mb-2" />
                  <p className="font-medium">Código enviado!</p>
                  <p className="text-sm text-muted-foreground">
                    Verifique sua caixa de entrada e spam
                  </p>
                </div>
                <p className="text-sm text-muted-foreground">
                  Redirecionando para a página de criação de senha...
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email cadastrado</Label>
                  <Input
                    id="email"
                    data-testid="input-request-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                  <p className="text-xs text-muted-foreground">
                    Use o mesmo email que seu treinador cadastrou no sistema
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-request-code"
                >
                  {isLoading ? "Enviando..." : "Enviar Código"}
                </Button>
              </form>
            )}

            <div className="mt-4 pt-4 border-t">
              <Link href="/atleta/login">
                <Button
                  variant="ghost"
                  className="w-full"
                  data-testid="link-back-to-login"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar para o Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
