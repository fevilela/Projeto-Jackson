import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Circle,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Athlete, Plan, PlanCharge } from "@shared/schema";
import { Link } from "wouter";

type AthleteWithPlan = Athlete & {
  planName?: string | null;
  planType?: string | null;
  planPrice?: string | null;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function currency(val: string | number) {
  return parseFloat(String(val || 0)).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function calcDueDate(dueDay: number | null | undefined, referenceMonth: string): string {
  if (!dueDay || !referenceMonth) return referenceMonth + "-01";
  const [year, month] = referenceMonth.split("-");
  const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
  const day = Math.min(dueDay, lastDay);
  return `${year}-${month}-${String(day).padStart(2, "0")}`;
}

// ── Main ───────────────────────────────────────────────────────────────────────

export default function Mensalidades() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [chargeDialog, setChargeDialog] = useState<AthleteWithPlan | null>(null);
  const [deleteChargeId, setDeleteChargeId] = useState<string | null>(null);

  // Filtros
  const [filterName, setFilterName] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "pendente" | "pago">("all");
  const [filterPlanType, setFilterPlanType] = useState<"all" | "por_aula" | "mensal">("all");
  const [filterDueDateFrom, setFilterDueDateFrom] = useState("");
  const [filterDueDateTo, setFilterDueDateTo] = useState("");

  // Form state for charge dialog
  const [chargeForm, setChargeForm] = useState({
    referenceMonth: new Date().toISOString().slice(0, 7),
    attendanceCount: "1",
    notes: "",
  });

  // Queries
  const { data: athletesWithPlan = [], isLoading } = useQuery<AthleteWithPlan[]>({
    queryKey: ["/api/athletes-with-plan"],
  });

  const { data: allCharges = [] } = useQuery<PlanCharge[]>({
    queryKey: ["/api/plan-charges"],
  });

  // Charges grouped by athleteId
  const chargesByAthlete = useMemo(() => {
    const map: Record<string, PlanCharge[]> = {};
    for (const c of allCharges) {
      if (!map[c.athleteId]) map[c.athleteId] = [];
      map[c.athleteId].push(c);
    }
    return map;
  }, [allCharges]);

  // Total de atletas com plano (sem filtros) — para distinguir "sem cadastro" de "sem resultado"
  const totalEnrolled = useMemo(
    () => athletesWithPlan.filter((a) => a.planId).length,
    [athletesWithPlan]
  );

  const hasActiveFilters =
    filterName || filterStatus !== "all" || filterPlanType !== "all" || filterDueDateFrom || filterDueDateTo;

  // Cobranças filtradas por status e data
  const filteredChargesByAthlete = useMemo(() => {
    const result: Record<string, PlanCharge[]> = {};
    for (const [athleteId, charges] of Object.entries(chargesByAthlete)) {
      let filtered = charges;
      if (filterStatus === "pendente") filtered = filtered.filter((c) => c.isPaid !== "sim");
      if (filterStatus === "pago") filtered = filtered.filter((c) => c.isPaid === "sim");
      if (filterDueDateFrom) filtered = filtered.filter((c) => c.chargeDate >= filterDueDateFrom);
      if (filterDueDateTo) filtered = filtered.filter((c) => c.chargeDate <= filterDueDateTo);
      result[athleteId] = filtered;
    }
    return result;
  }, [chargesByAthlete, filterStatus, filterDueDateFrom, filterDueDateTo]);

  // Atletas visíveis: filtra por nome e tipo de plano; se há filtro de status/data,
  // só mostra o atleta se ele tiver ao menos 1 cobrança que bata com o filtro
  const enrolledAthletes = useMemo(() => {
    return athletesWithPlan.filter((a) => {
      if (!a.planId) return false;
      if (filterName && !a.name.toLowerCase().includes(filterName.toLowerCase())) return false;
      if (filterPlanType !== "all" && a.planType !== filterPlanType) return false;
      // Se há filtro de status ou data, só mostra atleta com cobranças resultantes
      const hasStatusOrDateFilter =
        filterStatus !== "all" || filterDueDateFrom || filterDueDateTo;
      if (hasStatusOrDateFilter) {
        const filtered = filteredChargesByAthlete[a.id] ?? [];
        if (filtered.length === 0) return false;
      }
      return true;
    });
  }, [athletesWithPlan, filterName, filterPlanType, filterStatus, filterDueDateFrom, filterDueDateTo, filteredChargesByAthlete]);

  function clearFilters() {
    setFilterName("");
    setFilterStatus("all");
    setFilterPlanType("all");
    setFilterDueDateFrom("");
    setFilterDueDateTo("");
  }

  // Summary totals
  const totals = useMemo(() => {
    let totalDue = 0;
    let totalPaid = 0;
    for (const c of allCharges) {
      const v = parseFloat(c.amount);
      if (c.isPaid === "sim") totalPaid += v;
      else totalDue += v;
    }
    return { totalDue, totalPaid };
  }, [allCharges]);

  // ── Derived charge values ──────────────────────────────────────────────────

  const computedAmount = useMemo(() => {
    if (!chargeDialog?.planPrice) return 0;
    const price = parseFloat(chargeDialog.planPrice);
    if (chargeDialog.planType === "por_aula") {
      return price * (parseInt(chargeForm.attendanceCount) || 0);
    }
    return price; // mensal: valor fixo
  }, [chargeDialog, chargeForm.attendanceCount]);

  const computedDueDate = useMemo(() => {
    if (!chargeDialog) return "";
    return calcDueDate(chargeDialog.dueDay, chargeForm.referenceMonth);
  }, [chargeDialog, chargeForm.referenceMonth]);

  const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const computedDescription = useMemo(() => {
    if (!chargeDialog || !chargeForm.referenceMonth) return "";
    const [year, month] = chargeForm.referenceMonth.split("-");
    const monthName = monthNames[parseInt(month) - 1];
    if (chargeDialog.planType === "por_aula") {
      const count = parseInt(chargeForm.attendanceCount) || 0;
      return `${count} aula${count !== 1 ? "s" : ""} – ${monthName}/${year}`;
    }
    return `Mensalidade ${monthName}/${year}`;
  }, [chargeDialog, chargeForm]);

  // ── Mutations ──────────────────────────────────────────────────────────────

  const createCharge = useMutation({
    mutationFn: (data: object) => apiRequest("POST", "/api/plan-charges", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plan-charges"] });
      toast({ title: "Cobrança registrada com sucesso!" });
      setChargeDialog(null);
    },
    onError: () => toast({ title: "Erro ao registrar cobrança", variant: "destructive" }),
  });

  const togglePaid = useMutation({
    mutationFn: ({ id, isPaid }: { id: string; isPaid: string }) =>
      apiRequest("PATCH", `/api/plan-charges/${id}`, {
        isPaid,
        paidAt: isPaid === "sim" ? new Date().toISOString().split("T")[0] : null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plan-charges"] });
    },
  });

  const deleteCharge = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/plan-charges/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plan-charges"] });
      toast({ title: "Cobrança excluída!" });
      setDeleteChargeId(null);
    },
  });

  // ── Submit charge ──────────────────────────────────────────────────────────

  function openCharge(athlete: AthleteWithPlan) {
    setChargeDialog(athlete);
    setChargeForm({
      referenceMonth: new Date().toISOString().slice(0, 7),
      attendanceCount: "1",
      notes: "",
    });
  }

  function submitCharge() {
    if (!chargeDialog || computedAmount <= 0) return;
    createCharge.mutate({
      athleteId: chargeDialog.id,
      planId: chargeDialog.planId,
      chargeDate: computedDueDate,
      description: computedDescription,
      attendanceCount: parseInt(chargeForm.attendanceCount) || 1,
      amount: computedAmount.toFixed(2),
      notes: chargeForm.notes,
    });
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (!isLoading && totalEnrolled === 0) {
    return (
      <div className="p-6 text-center py-20 space-y-2">
        <p className="text-muted-foreground text-lg">Nenhum aluno com plano vinculado.</p>
        <p className="text-sm text-muted-foreground">
          Primeiro cadastre os planos em{" "}
          <Link href="/plans" className="text-primary underline">
            Cadastro → Planos
          </Link>
          , depois vincule um plano ao aluno em{" "}
          <Link href="/athletes" className="text-primary underline">
            Cadastro → Atletas
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Mensalidades</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Registre presenças e cobranças de cada aluno
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              A Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-500">
              {currency(totals.totalDue)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Recebido
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-500">
              {currency(totals.totalPaid)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="mb-4 space-y-3">
        <div className="flex gap-2 flex-wrap">
          {/* Nome */}
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar atleta..."
              value={filterName}
              onChange={(e) => setFilterName(e.target.value)}
            />
          </div>

          {/* Status */}
          <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pendente">A receber</SelectItem>
              <SelectItem value="pago">Pagos</SelectItem>
            </SelectContent>
          </Select>

          {/* Tipo de plano */}
          <Select value={filterPlanType} onValueChange={(v) => setFilterPlanType(v as any)}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Tipo de plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              <SelectItem value="por_aula">Por aula</SelectItem>
              <SelectItem value="mensal">Mensal</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        {/* Datas de vencimento */}
        <div className="flex gap-2 items-center flex-wrap">
          <span className="text-sm text-muted-foreground">Vencimento entre</span>
          <Input
            type="date"
            className="w-40"
            value={filterDueDateFrom}
            onChange={(e) => setFilterDueDateFrom(e.target.value)}
          />
          <span className="text-sm text-muted-foreground">e</span>
          <Input
            type="date"
            className="w-40"
            value={filterDueDateTo}
            onChange={(e) => setFilterDueDateTo(e.target.value)}
          />
        </div>
      </div>

      {/* Athletes list */}
      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : (
        <div className="space-y-3">
          {enrolledAthletes.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Nenhum resultado para os filtros aplicados.
            </p>
          )}
          {enrolledAthletes.map((athlete) => {
            const charges = filteredChargesByAthlete[athlete.id] ?? [];
            const totalOwed = charges
              .filter((c) => c.isPaid !== "sim")
              .reduce((s, c) => s + parseFloat(c.amount), 0);
            const totalPaid = charges
              .filter((c) => c.isPaid === "sim")
              .reduce((s, c) => s + parseFloat(c.amount), 0);
            const isExpanded = expandedId === athlete.id;

            return (
              <div key={athlete.id} className="border rounded-lg overflow-hidden">
                {/* Row header — clica para expandir */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => setExpandedId(isExpanded ? null : athlete.id)}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold">{athlete.name}</span>
                      {athlete.planName && (
                        <Badge
                          variant={athlete.planType === "mensal" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {athlete.planName}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {athlete.planPrice && athlete.planType && (
                        <>
                          {athlete.planType === "mensal"
                            ? `${currency(athlete.planPrice)}/mês`
                            : `${currency(athlete.planPrice)}/aula`}
                          {athlete.dueDay && ` · Vence dia ${athlete.dueDay}`}
                        </>
                      )}
                    </p>
                  </div>

                  <div className="text-right flex-shrink-0">
                    {totalOwed > 0 && (
                      <p className="text-sm font-semibold text-orange-500">
                        {currency(totalOwed)} a receber
                      </p>
                    )}
                    {totalPaid > 0 && (
                      <p className="text-xs text-green-600">
                        {currency(totalPaid)} recebido
                      </p>
                    )}
                    {charges.length === 0 && (
                      <p className="text-xs text-muted-foreground">Sem cobranças</p>
                    )}
                  </div>
                </div>

                {/* Expanded */}
                {isExpanded && (
                  <div className="border-t bg-muted/20">
                    <div className="flex items-center justify-between px-4 py-2 border-b">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Cobranças
                      </span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openCharge(athlete)}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {athlete.planType === "mensal"
                          ? "Adicionar Mensalidade"
                          : "Registrar Aulas"}
                      </Button>
                    </div>

                    {charges.length === 0 ? (
                      <p className="text-sm text-muted-foreground px-4 py-4 text-center">
                        Nenhuma cobrança ainda.
                      </p>
                    ) : (
                      <div className="divide-y">
                        {charges.map((charge) => (
                          <div key={charge.id} className="flex items-center gap-3 px-4 py-3">
                            <button
                              onClick={() =>
                                togglePaid.mutate({
                                  id: charge.id,
                                  isPaid: charge.isPaid === "sim" ? "nao" : "sim",
                                })
                              }
                              className="flex-shrink-0"
                            >
                              {charge.isPaid === "sim" ? (
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-sm font-medium ${
                                  charge.isPaid === "sim"
                                    ? "line-through text-muted-foreground"
                                    : ""
                                }`}
                              >
                                {charge.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Vence{" "}
                                {new Date(charge.chargeDate + "T12:00:00").toLocaleDateString("pt-BR")}
                                {charge.attendanceCount > 1 && ` · ${charge.attendanceCount} presenças`}
                                {charge.paidAt && charge.isPaid === "sim" && (
                                  <> · Pago em{" "}
                                  {new Date(charge.paidAt + "T12:00:00").toLocaleDateString("pt-BR")}</>
                                )}
                              </p>
                            </div>
                            <p
                              className={`text-sm font-semibold flex-shrink-0 ${
                                charge.isPaid === "sim" ? "text-green-600" : "text-orange-500"
                              }`}
                            >
                              {currency(charge.amount)}
                            </p>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="flex-shrink-0 h-7 w-7"
                              onClick={() => setDeleteChargeId(charge.id)}
                            >
                              <Trash2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {charges.length > 0 && (
                      <div className="flex justify-end gap-4 px-4 py-2 border-t text-sm font-medium">
                        <span className="text-muted-foreground">
                          Total:{" "}
                          {currency(charges.reduce((s, c) => s + parseFloat(c.amount), 0))}
                        </span>
                        <span className="text-orange-500">A receber: {currency(totalOwed)}</span>
                        <span className="text-green-600">Recebido: {currency(totalPaid)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Charge Dialog ──────────────────────────────────────────────────────── */}
      <Dialog open={!!chargeDialog} onOpenChange={() => setChargeDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {chargeDialog?.planType === "mensal"
                ? `Mensalidade — ${chargeDialog?.name}`
                : `Registrar Aulas — ${chargeDialog?.name}`}
            </DialogTitle>
          </DialogHeader>

          {chargeDialog && (
            <div className="space-y-4">
              {/* Plano info (read-only) */}
              <div className="rounded-md bg-muted px-4 py-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="font-medium">{chargeDialog.planName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    {chargeDialog.planType === "mensal" ? "Valor mensal" : "Valor por aula"}
                  </span>
                  <span className="font-medium">{currency(chargeDialog.planPrice ?? 0)}</span>
                </div>
                {chargeDialog.dueDay && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dia de vencimento</span>
                    <span className="font-medium">Todo dia {chargeDialog.dueDay}</span>
                  </div>
                )}
              </div>

              {/* Mês de referência */}
              <div className="space-y-2">
                <Label htmlFor="ref-month">Mês de Referência</Label>
                <Input
                  id="ref-month"
                  type="month"
                  value={chargeForm.referenceMonth}
                  onChange={(e) =>
                    setChargeForm({ ...chargeForm, referenceMonth: e.target.value })
                  }
                />
              </div>

              {/* Quantidade de presenças */}
              <div className="space-y-2">
                <Label htmlFor="attendance">
                  {chargeDialog.planType === "mensal"
                    ? "Presenças no mês (informativo)"
                    : "Quantidade de aulas"}
                </Label>
                <Input
                  id="attendance"
                  type="number"
                  min="1"
                  value={chargeForm.attendanceCount}
                  onChange={(e) =>
                    setChargeForm({ ...chargeForm, attendanceCount: e.target.value })
                  }
                />
                {chargeDialog.planType === "mensal" && (
                  <p className="text-xs text-muted-foreground">
                    Para plano mensal o valor é fixo, independente da quantidade de aulas.
                  </p>
                )}
              </div>

              {/* Preview calculado */}
              <div className="rounded-md border-2 border-primary/20 bg-primary/5 px-4 py-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Descrição</span>
                  <span className="font-medium">{computedDescription}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vencimento</span>
                  <span className="font-medium">
                    {computedDueDate
                      ? new Date(computedDueDate + "T12:00:00").toLocaleDateString("pt-BR")
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between text-base font-bold">
                  <span>Total</span>
                  <span className="text-primary">{currency(computedAmount)}</span>
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="charge-notes">Observações (opcional)</Label>
                <Textarea
                  id="charge-notes"
                  placeholder="Ex: aluna faltou 1 semana..."
                  value={chargeForm.notes}
                  onChange={(e) =>
                    setChargeForm({ ...chargeForm, notes: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setChargeDialog(null)}>
              Cancelar
            </Button>
            <Button
              onClick={submitCharge}
              disabled={createCharge.isPending || computedAmount <= 0}
            >
              {chargeDialog?.planType === "mensal" ? "Lançar Mensalidade" : "Registrar Aulas"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete charge confirm ───────────────────────────────────────────── */}
      <Dialog open={!!deleteChargeId} onOpenChange={() => setDeleteChargeId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Cobrança</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir esta cobrança?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteChargeId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteChargeId && deleteCharge.mutate(deleteChargeId)}
              disabled={deleteCharge.isPending}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
