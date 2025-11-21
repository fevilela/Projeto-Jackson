import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  DollarSign,
} from "lucide-react";
import type { FinancialTransaction, Athlete } from "@shared/schema";

const formSchema = z.object({
  type: z.enum(["receita", "despesa"]),
  athleteId: z.string().optional(),
  description: z.string().min(1, "Descrição é obrigatória"),
  totalAmount: z.string().min(1, "Valor total é obrigatório"),
  paidAmount: z.string().optional(),
  dueDate: z.string().min(1, "Data de vencimento é obrigatória"),
  paymentDate: z.string().optional(),
  status: z.enum(["pendente", "pago_parcial", "pago"]),
  observations: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function Financial() {
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery<
    (FinancialTransaction & { athleteName?: string | null })[]
  >({
    queryKey: ["/api/financial-transactions"],
  });

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      type: "receita",
      description: "",
      totalAmount: "",
      paidAmount: "0",
      dueDate: "",
      paymentDate: "",
      status: "pendente",
      observations: "",
      athleteId: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Não enviar userId - o backend sempre usa o da sessão
      const payload = {
        type: data.type,
        athleteId: data.athleteId || null,
        description: data.description,
        totalAmount: data.totalAmount,
        paidAmount: data.paidAmount || "0",
        dueDate: data.dueDate,
        paymentDate: data.paymentDate || null,
        status: data.status,
        observations: data.observations || null,
      };
      return apiRequest("POST", "/api/financial-transactions", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/financial-transactions"],
      });
      toast({
        title: "Sucesso",
        description: "Transação criada com sucesso",
      });
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar transação",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: Partial<FormData>;
    }) => {
      // Não enviar userId - o backend sempre usa o da sessão
      const payload: Record<string, any> = {};
      if (data.type !== undefined) payload.type = data.type;
      if (data.athleteId !== undefined)
        payload.athleteId = data.athleteId || null;
      if (data.description !== undefined)
        payload.description = data.description;
      if (data.totalAmount !== undefined)
        payload.totalAmount = data.totalAmount;
      if (data.paidAmount !== undefined)
        payload.paidAmount = data.paidAmount || "0";
      if (data.dueDate !== undefined) payload.dueDate = data.dueDate;
      if (data.paymentDate !== undefined)
        payload.paymentDate = data.paymentDate || null;
      if (data.status !== undefined) payload.status = data.status;
      if (data.observations !== undefined)
        payload.observations = data.observations || null;

      return apiRequest("PATCH", `/api/financial-transactions/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/financial-transactions"],
      });
      toast({
        title: "Sucesso",
        description: "Transação atualizada com sucesso",
      });
      setEditingId(null);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao atualizar transação",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/financial-transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/financial-transactions"],
      });
      toast({
        title: "Sucesso",
        description: "Transação excluída com sucesso",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir transação",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (
    transaction: FinancialTransaction & { athleteName?: string | null }
  ) => {
    setEditingId(transaction.id);
    form.reset({
      type: transaction.type as "receita" | "despesa",
      athleteId: transaction.athleteId || "",
      description: transaction.description,
      totalAmount: transaction.totalAmount,
      paidAmount: transaction.paidAmount,
      dueDate: transaction.dueDate,
      paymentDate: transaction.paymentDate || "",
      status: transaction.status as "pendente" | "pago_parcial" | "pago",
      observations: transaction.observations || "",
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    form.reset();
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pendente: "destructive",
      pago_parcial: "default",
      pago: "default",
    };
    const labels = {
      pendente: "Pendente",
      pago_parcial: "Pago Parcial",
      pago: "Pago",
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const calculateSummary = () => {
    const receitas = transactions
      .filter((t) => t.type === "receita")
      .reduce((sum, t) => sum + parseFloat(t.paidAmount), 0);
    const despesas = transactions
      .filter((t) => t.type === "despesa")
      .reduce((sum, t) => sum + parseFloat(t.paidAmount), 0);
    return { receitas, despesas, saldo: receitas - despesas };
  };

  const summary = calculateSummary();

  return (
    <div
      className="container mx-auto p-6 space-y-6"
      data-testid="page-financial"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" data-testid="text-page-title">
            Controle Financeiro
          </h1>
          <p className="text-muted-foreground">
            Gerencie receitas e despesas dos atletas
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receitas</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-green-500"
              data-testid="text-total-receitas"
            >
              R$ {summary.receitas.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Despesas</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold text-red-500"
              data-testid="text-total-despesas"
            >
              R$ {summary.despesas.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-1 space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo</CardTitle>
            <DollarSign className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                summary.saldo >= 0 ? "text-green-500" : "text-red-500"
              }`}
              data-testid="text-saldo"
            >
              R$ {summary.saldo.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle data-testid="text-form-title">
            {editingId ? "Editar Transação" : "Nova Transação"}
          </CardTitle>
          <CardDescription>
            {editingId
              ? "Atualize os dados da transação"
              : "Adicione uma nova receita ou despesa"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder="Selecione o tipo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="receita">Receita</SelectItem>
                          <SelectItem value="despesa">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="athleteId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Atleta (opcional)</FormLabel>
                      <Select
                        onValueChange={(value) =>
                          field.onChange(value === "none" ? "" : value)
                        }
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-athlete">
                            <SelectValue placeholder="Selecione um atleta" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">Nenhum</SelectItem>
                          {athletes.map((athlete) => (
                            <SelectItem key={athlete.id} value={athlete.id}>
                              {athlete.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ex: Mensalidade"
                          data-testid="input-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="totalAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Total</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-total-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paidAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valor Pago</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          data-testid="input-paid-amount"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Vencimento</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          data-testid="input-due-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="paymentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data de Pagamento (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="date"
                          data-testid="input-payment-date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-status">
                            <SelectValue placeholder="Selecione o status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="pago_parcial">
                            Pago Parcial
                          </SelectItem>
                          <SelectItem value="pago">Pago</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="observations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observações (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Observações adicionais"
                        data-testid="textarea-observations"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button
                  type="submit"
                  disabled={
                    createMutation.isPending || updateMutation.isPending
                  }
                  data-testid="button-submit"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {editingId ? "Atualizar" : "Adicionar"}
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancelEdit}
                    data-testid="button-cancel"
                  >
                    Cancelar
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transações</CardTitle>
          <CardDescription>Histórico de todas as transações</CardDescription>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div>Carregando...</div>
          ) : transactions.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              Nenhuma transação encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Atleta</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Valor Pago</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow
                    key={transaction.id}
                    data-testid={`row-transaction-${transaction.id}`}
                  >
                    <TableCell>
                      <Badge
                        variant={
                          transaction.type === "receita"
                            ? "default"
                            : "destructive"
                        }
                      >
                        {transaction.type === "receita" ? "Receita" : "Despesa"}
                      </Badge>
                    </TableCell>
                    <TableCell>{transaction.description}</TableCell>
                    <TableCell>{transaction.athleteName || "Nenhum"}</TableCell>
                    <TableCell>
                      {format(new Date(transaction.dueDate), "dd/MM/yyyy", {
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell>
                      R$ {parseFloat(transaction.totalAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>
                      R$ {parseFloat(transaction.paidAmount).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(transaction)}
                          data-testid={`button-edit-${transaction.id}`}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteMutation.mutate(transaction.id)}
                          disabled={deleteMutation.isPending}
                          data-testid={`button-delete-${transaction.id}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
