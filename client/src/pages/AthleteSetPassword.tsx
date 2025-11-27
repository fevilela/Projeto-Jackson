import { useState, useEffect } from "react";
import { Link, useLocation, useSearch } from "wouter";
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
import { Activity, KeyRound, ArrowLeft, Check } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

export default function AthleteSetPassword() {
  const searchString = useSearch();
  const params = new URLSearchParams(searchString);
  const emailFromUrl = params.get("email") || "";

  const [email, setEmail] = useState(emailFromUrl);
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"code" | "password">("code");
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (emailFromUrl) {
      setEmail(emailFromUrl);
    }
  }, [emailFromUrl]);

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/athlete/auth/verify-code", {
        email,
        code,
      });
      setStep("password");
      toast({
        title: "Código verificado!",
        description: "Agora crie sua senha.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Código inválido",
        description: error.message || "Verifique o código e tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Senhas não conferem",
        description: "Digite a mesma senha nos dois campos",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres",
      });
      return;
    }

    setIsLoading(true);

    try {
      await apiRequest("POST", "/api/athlete/auth/set-password", {
        email,
        code,
        password,
        confirmPassword,
      });
      setSuccess(true);
      toast({
        title: "Senha criada com sucesso!",
        description: "Agora você pode fazer login.",
      });
      setTimeout(() => {
        setLocation("/atleta/login");
      }, 3000);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro ao criar senha",
        description: error.message || "Tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-md space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="bg-green-500/10 p-4 rounded-full inline-block">
                  <Check className="h-12 w-12 text-green-500" />
                </div>
                <h2 className="text-2xl font-bold">
                  Senha criada com sucesso!
                </h2>
                <p className="text-muted-foreground">
                  Redirecionando para a página de login...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <Activity className="h-12 w-12 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Área do Atleta</h1>
          <p className="text-muted-foreground">
            {step === "code" ? "Digite o código recebido" : "Crie sua senha"}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              {step === "code" ? "Verificar Código" : "Criar Senha"}
            </CardTitle>
            <CardDescription>
              {step === "code"
                ? "Digite o código de 6 dígitos enviado para seu email"
                : "Escolha uma senha segura para sua conta"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {step === "code" ? (
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    data-testid="input-verify-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Código de Verificação</Label>
                  <div className="flex justify-center">
                    <InputOTP
                      maxLength={6}
                      value={code}
                      onChange={setCode}
                      data-testid="input-otp-code"
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    O código expira em 15 minutos
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || code.length !== 6}
                  data-testid="button-verify-code"
                >
                  {isLoading ? "Verificando..." : "Verificar Código"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleSetPassword} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">Nova Senha</Label>
                  <Input
                    id="password"
                    data-testid="input-new-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <Input
                    id="confirmPassword"
                    data-testid="input-confirm-password"
                    type="password"
                    placeholder="Digite a senha novamente"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-set-password"
                >
                  {isLoading ? "Criando..." : "Criar Senha"}
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
