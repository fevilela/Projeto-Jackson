import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wifi,
  WifiOff,
  Loader2,
  MessageCircle,
  Bell,
  CheckCircle2,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

type WhatsAppStatus = {
  status: "disconnected" | "connecting" | "connected";
  qr?: string;
};

export default function WhatsappSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("Olá! Esta é uma mensagem de teste do sistema Jackson Treinos. 👋");

  // Poll status a cada 2s enquanto conectando
  const { data: status } = useQuery<WhatsAppStatus>({
    queryKey: ["/api/whatsapp/status"],
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "connecting" || s === "disconnected" ? 2000 : 10000;
    },
  });

  const connectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/whatsapp/connect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
    },
    onError: () => toast({ title: "Erro ao iniciar conexão", variant: "destructive" }),
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/whatsapp/disconnect"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/status"] });
      toast({ title: "WhatsApp desconectado com sucesso" });
    },
    onError: () => toast({ title: "Erro ao desconectar", variant: "destructive" }),
  });

  const testNotifMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/whatsapp/test-notification"),
    onSuccess: () => toast({ title: "Verificação executada!", description: "Notificações pendentes foram enviadas." }),
    onError: () => toast({ title: "Erro ao executar verificação", variant: "destructive" }),
  });

  const sendTestMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/whatsapp/send-test", { phone: testPhone, message: testMessage }),
    onSuccess: () => toast({ title: "Mensagem de teste enviada!" }),
    onError: async (err: any) => {
      let detail = "Erro ao enviar mensagem de teste";
      try {
        const body = await err?.response?.json?.();
        if (body?.error) detail = body.error;
      } catch {}
      toast({ title: detail, variant: "destructive" });
    },
  });

  const isConnected = status?.status === "connected";
  const isConnecting = status?.status === "connecting";

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">WhatsApp</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Conecte seu WhatsApp para enviar notificações automáticas de vencimento
        </p>
      </div>

      {/* Status card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="h-5 w-5" />
            Status da Conexão
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected ? (
                <Wifi className="h-6 w-6 text-green-500" />
              ) : isConnecting ? (
                <Loader2 className="h-6 w-6 text-yellow-500 animate-spin" />
              ) : (
                <WifiOff className="h-6 w-6 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">
                  {isConnected
                    ? "Conectado"
                    : isConnecting
                    ? "Aguardando escaneamento do QR code..."
                    : "Desconectado"}
                </p>
                {isConnected && (
                  <p className="text-xs text-muted-foreground">
                    Notificações automáticas ativas · Roda todo dia às 8h
                  </p>
                )}
              </div>
            </div>
            <Badge
              variant={isConnected ? "default" : isConnecting ? "secondary" : "outline"}
              className={isConnected ? "bg-green-500" : ""}
            >
              {isConnected ? "Online" : isConnecting ? "Conectando" : "Offline"}
            </Badge>
          </div>

          {/* QR Code */}
          {isConnecting && status?.qr && (
            <div className="flex flex-col items-center gap-3 py-4 border rounded-lg bg-white">
              <p className="text-sm text-gray-600 font-medium">
                Escaneie o QR code com seu WhatsApp
              </p>
              <img src={status.qr} alt="QR Code WhatsApp" className="w-56 h-56" />
              <p className="text-xs text-gray-400 text-center">
                Abra o WhatsApp → Dispositivos conectados → Conectar dispositivo
              </p>
            </div>
          )}

          {isConnecting && !status?.qr && (
            <div className="flex items-center justify-center gap-2 py-6 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Gerando QR code...</span>
            </div>
          )}

          <div className="flex gap-2">
            {!isConnected && !isConnecting && (
              <Button
                onClick={() => connectMutation.mutate()}
                disabled={connectMutation.isPending}
                className="flex-1"
              >
                {connectMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4 mr-2" />
                )}
                Conectar WhatsApp
              </Button>
            )}

            {isConnecting && (
              <Button
                variant="outline"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="flex-1"
              >
                Cancelar
              </Button>
            )}

            {isConnected && (
              <Button
                variant="outline"
                onClick={() => disconnectMutation.mutate()}
                disabled={disconnectMutation.isPending}
                className="flex-1"
              >
                <WifiOff className="h-4 w-4 mr-2" />
                Desconectar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notification rules */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-5 w-5" />
            Regras de Notificação
          </CardTitle>
          <CardDescription>
            As mensagens são enviadas automaticamente todo dia às 8h da manhã
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <CheckCircle2 className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">4 dias antes do vencimento</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                "Olá, [Nome]! Sua mensalidade do plano [Plano] vence em 4 dias, no dia [data]. Valor: R$ [valor]."
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg border">
            <CheckCircle2 className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">No dia do vencimento</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                "Olá, [Nome]! Sua mensalidade do plano [Plano] vence hoje, [data]. Por favor, efetue o pagamento."
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            • Só envia para cobranças ainda não pagas<br />
            • O aluno precisa ter telefone cadastrado<br />
            • Cada notificação é enviada apenas uma vez
          </p>

          {isConnected && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => testNotifMutation.mutate()}
              disabled={testNotifMutation.isPending}
            >
              {testNotifMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Executar verificação agora
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Test message */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageCircle className="h-5 w-5" />
              Enviar Mensagem de Teste
            </CardTitle>
            <CardDescription>
              Verifique se a conexão está funcionando enviando uma mensagem
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="test-phone">Número de telefone</Label>
              <Input
                id="test-phone"
                placeholder="(11) 99999-9999"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-msg">Mensagem</Label>
              <Textarea
                id="test-msg"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                rows={3}
              />
            </div>
            <Button
              onClick={() => sendTestMutation.mutate()}
              disabled={sendTestMutation.isPending || !testPhone}
              size="sm"
            >
              {sendTestMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageCircle className="h-4 w-4 mr-2" />
              )}
              Enviar teste
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
