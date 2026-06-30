import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Plan } from "@shared/schema";

const planSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  type: z.enum(["por_aula", "mensal"], { required_error: "Tipo obrigatório" }),
  price: z.string().min(1, "Valor obrigatório"),
  description: z.string().optional(),
});

type PlanForm = z.infer<typeof planSchema>;

export default function Plans() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  const form = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: { name: "", type: undefined, price: "", description: "" },
  });

  const createMutation = useMutation({
    mutationFn: (data: PlanForm) => apiRequest("POST", "/api/plans", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: "Plano criado com sucesso!" });
      setDialogOpen(false);
      form.reset();
    },
    onError: () => toast({ title: "Erro ao criar plano", variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: (data: PlanForm) =>
      apiRequest("PATCH", `/api/plans/${editing!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      toast({ title: "Plano atualizado com sucesso!" });
      setDialogOpen(false);
      setEditing(null);
      form.reset();
    },
    onError: () => toast({ title: "Erro ao atualizar plano", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/plans/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/athlete-plans"] });
      toast({ title: "Plano excluído com sucesso!" });
      setDeleteId(null);
    },
    onError: () => toast({ title: "Erro ao excluir plano", variant: "destructive" }),
  });

  function openNew() {
    setEditing(null);
    form.reset({ name: "", type: undefined, price: "", description: "" });
    setDialogOpen(true);
  }

  function openEdit(plan: Plan) {
    setEditing(plan);
    form.reset({
      name: plan.name,
      type: plan.type as "por_aula" | "mensal",
      price: plan.price,
      description: plan.description ?? "",
    });
    setDialogOpen(true);
  }

  function onSubmit(data: PlanForm) {
    if (editing) updateMutation.mutate(data);
    else createMutation.mutate(data);
  }

  const formatPrice = (price: string, type: string) => {
    const value = parseFloat(price).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
    return type === "por_aula" ? `${value}/aula` : `${value}/mês`;
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Planos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Cadastre os planos de assinatura disponíveis para seus alunos
          </p>
        </div>
        <Button onClick={openNew}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Plano
        </Button>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum plano cadastrado ainda.</p>
          <p className="text-sm mt-1">Clique em "Novo Plano" para começar.</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.id}>
                <TableCell className="font-medium">{plan.name}</TableCell>
                <TableCell>
                  <Badge variant={plan.type === "mensal" ? "default" : "secondary"}>
                    {plan.type === "mensal" ? "Mensal" : "Por Aula"}
                  </Badge>
                </TableCell>
                <TableCell>{formatPrice(plan.price, plan.type)}</TableCell>
                <TableCell className="text-muted-foreground">
                  {plan.description ?? "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEdit(plan)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(plan.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar Plano" : "Novo Plano"}</DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Plano</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Plano Diário, Plano Mensal..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Cobrança</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="por_aula">Por Aula (cobrado por sessão)</SelectItem>
                        <SelectItem value="mensal">Mensal (valor fixo mensal)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Valor (R$){" "}
                      <span className="text-muted-foreground font-normal text-xs">
                        {form.watch("type") === "por_aula"
                          ? "— valor por aula/hora"
                          : form.watch("type") === "mensal"
                          ? "— valor mensal fixo"
                          : ""}
                      </span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0,00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (opcional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: 3x por semana, treinos de corrida..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {editing ? "Salvar" : "Criar Plano"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Plano</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Tem certeza que deseja excluir este plano? As matrículas de alunos
            vinculadas a este plano também serão removidas.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
              disabled={deleteMutation.isPending}
            >
              Excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
