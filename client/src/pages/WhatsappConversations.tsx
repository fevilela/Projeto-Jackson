import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Send, Search, Loader2, Plus, MessageCircleMore, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";

type Athlete = {
  id: string;
  name: string;
  phone: string | null;
};

type Conversation = {
  athleteId: string;
  athleteName: string;
  athletePhone: string | null;
  lastMessage: string | null;
  lastSentAt: string | null;
};

type WhatsappMessage = {
  id: string;
  athleteId: string;
  phone: string;
  message: string;
  type: "manual" | "pre_due" | "on_due";
  sentAt: string;
};

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function formatListTime(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

const typeLabel: Record<string, string> = {
  manual: "",
  pre_due: "Aviso automático · 4 dias antes",
  on_due: "Aviso automático · vencimento",
};

function Avatar({
  athleteId,
  name,
  size = "md",
}: {
  athleteId: string;
  name: string;
  size?: "sm" | "md";
}) {
  const { data } = useQuery<{ url: string | null }>({
    queryKey: ["/api/whatsapp/profile-picture", athleteId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/whatsapp/profile-picture/${athleteId}`);
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
  });

  const dim = size === "sm" ? "h-9 w-9" : "h-12 w-12";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  if (data?.url) {
    return (
      <img
        src={data.url}
        alt={name}
        className={cn(dim, "rounded-full object-cover flex-shrink-0 border")}
      />
    );
  }

  return (
    <div
      className={cn(
        dim,
        textSize,
        "rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary font-medium"
      )}
    >
      {name ? initials(name) : <User className="h-4 w-4" />}
    </div>
  );
}

export default function WhatsappConversations() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newConvoOpen, setNewConvoOpen] = useState(false);
  const [newConvoAthleteId, setNewConvoAthleteId] = useState("");

  const { data: conversations = [], isLoading } = useQuery<Conversation[]>({
    queryKey: ["/api/whatsapp/conversations"],
  });

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const athletesWithoutConvo = useMemo(() => {
    const existingIds = new Set(conversations.map((c) => c.athleteId));
    return athletes.filter((a) => !existingIds.has(a.id));
  }, [athletes, conversations]);

  const { data: messages = [], isLoading: loadingMessages } = useQuery<WhatsappMessage[]>({
    queryKey: ["/api/whatsapp/conversations", selectedAthleteId],
    enabled: !!selectedAthleteId,
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/whatsapp/conversations/${selectedAthleteId}`);
      return res.json();
    },
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      apiRequest("POST", "/api/whatsapp/send-to-athlete", {
        athleteId: selectedAthleteId,
        message: newMessage,
      }),
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/conversations"] });
      queryClient.invalidateQueries({ queryKey: ["/api/whatsapp/conversations", selectedAthleteId] });
    },
    onError: async (err: any) => {
      let detail = "Erro ao enviar mensagem";
      try {
        const body = await err?.response?.json?.();
        if (body?.error) detail = body.error;
      } catch {}
      toast({ title: detail, variant: "destructive" });
    },
  });

  const filteredConversations = useMemo(() => {
    if (!search.trim()) return conversations;
    return conversations.filter((c) =>
      c.athleteName.toLowerCase().includes(search.toLowerCase())
    );
  }, [conversations, search]);

  const selectedConversation = conversations.find((c) => c.athleteId === selectedAthleteId);
  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);
  const displayName = selectedConversation?.athleteName ?? selectedAthlete?.name ?? "";
  const displayPhone = selectedConversation?.athletePhone ?? selectedAthlete?.phone;

  return (
    <div className="flex h-[calc(100vh-65px)] overflow-hidden bg-background">
      {/* Lista de conversas */}
      <div className="w-[340px] flex flex-col border-r bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h1 className="font-semibold text-lg">Conversas</h1>
          <Dialog open={newConvoOpen} onOpenChange={setNewConvoOpen}>
            <DialogTrigger asChild>
              <Button size="icon" variant="ghost" title="Nova conversa">
                <Plus className="h-5 w-5" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Iniciar conversa</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <Select value={newConvoAthleteId} onValueChange={setNewConvoAthleteId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    {athletesWithoutConvo.length === 0 && (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Todos os alunos já têm conversa
                      </div>
                    )}
                    {athletesWithoutConvo.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name} {!a.phone && "(sem telefone)"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  className="w-full"
                  disabled={!newConvoAthleteId}
                  onClick={() => {
                    setSelectedAthleteId(newConvoAthleteId);
                    setNewConvoOpen(false);
                    setNewConvoAthleteId("");
                  }}
                >
                  Iniciar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="px-3 py-2 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Pesquisar aluno"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="p-4 text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Carregando...
            </div>
          )}
          {!isLoading && filteredConversations.length === 0 && (
            <div className="p-6 text-sm text-muted-foreground text-center">
              Nenhuma conversa ainda.
              <br />
              Clique no <Plus className="inline h-3.5 w-3.5" /> para começar.
            </div>
          )}
          {filteredConversations.map((c) => (
            <button
              key={c.athleteId}
              onClick={() => setSelectedAthleteId(c.athleteId)}
              className={cn(
                "w-full text-left px-3 py-3 flex items-center gap-3 border-b hover:bg-muted/50 transition-colors",
                selectedAthleteId === c.athleteId && "bg-muted"
              )}
            >
              <Avatar athleteId={c.athleteId} name={c.athleteName} />
              <div className="min-w-0 flex-1">
                <div className="flex justify-between items-baseline">
                  <span className="font-medium truncate text-sm">{c.athleteName}</span>
                  {c.lastSentAt && (
                    <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                      {formatListTime(c.lastSentAt)}
                    </span>
                  )}
                </div>
                {c.lastMessage && (
                  <p className="text-xs text-muted-foreground truncate mt-0.5">{c.lastMessage}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Histórico de mensagens */}
      <div className="flex-1 flex flex-col">
        {!selectedAthleteId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
            <MessageCircleMore className="h-16 w-16 opacity-20" />
            <p className="text-sm">Selecione uma conversa para ver o histórico</p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
              <Avatar athleteId={selectedAthleteId} name={displayName} size="sm" />
              <div className="min-w-0">
                <p className="font-medium truncate text-sm">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{displayPhone || "sem telefone"}</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-1.5 bg-muted/20">
              {loadingMessages && (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando mensagens...
                </div>
              )}
              {!loadingMessages && messages.length === 0 && (
                <div className="text-sm text-muted-foreground text-center mt-8">
                  Nenhuma mensagem ainda. Envie a primeira abaixo.
                </div>
              )}
              {messages.map((m) => (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-md rounded-lg rounded-tr-none px-3 py-1.5 shadow-sm bg-primary text-primary-foreground">
                    {typeLabel[m.type] && (
                      <p className="text-[10px] uppercase tracking-wide font-semibold mb-1 opacity-80">
                        {typeLabel[m.type]}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{m.message}</p>
                    <p className="text-[10px] text-right mt-0.5 opacity-70">
                      {formatTime(m.sentAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="px-4 py-3 flex items-center gap-2 border-t bg-card">
              <Input
                placeholder="Digite uma mensagem"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newMessage.trim()) sendMutation.mutate();
                }}
              />
              <Button
                size="icon"
                onClick={() => sendMutation.mutate()}
                disabled={!newMessage.trim() || sendMutation.isPending}
                className="flex-shrink-0"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
