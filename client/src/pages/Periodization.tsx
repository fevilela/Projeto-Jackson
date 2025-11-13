import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Athlete {
  id: string;
  name: string;
}

interface PeriodizationPlan {
  id: string;
  athleteId: string;
  userId: string;
  period: string;
  mainFocus: string;
  weeklyStructure: string | null;
  volumeIntensity: string | null;
  observations: string | null;
  createdAt: string;
}

const planFormSchema = z.object({
  period: z.string().min(1, "Período é obrigatório"),
  mainFocus: z.string().min(1, "Foco principal é obrigatório"),
  weeklyStructure: z.string().optional(),
  volumeIntensity: z.string().optional(),
  observations: z.string().optional(),
});

type PlanFormValues = z.infer<typeof planFormSchema>;

export default function Periodization() {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [generalObservations, setGeneralObservations] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api", "athletes"],
  });

  const { data: plans = [], isLoading: plansLoading } = useQuery<
    PeriodizationPlan[]
  >({
    queryKey: ["/api/periodization-plans/athlete", selectedAthleteId],
    enabled: !!selectedAthleteId,
  });

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      period: "",
      mainFocus: "",
      weeklyStructure: "",
      volumeIntensity: "",
      observations: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PlanFormValues) => {
      const response = await apiRequest("POST", "/api/periodization-plans", {
        ...data,
        athleteId: selectedAthleteId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/periodization-plans/athlete", selectedAthleteId],
      });
      toast({
        title: "Período adicionado",
        description: "O período foi adicionado com sucesso.",
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o período.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/periodization-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/periodization-plans/athlete", selectedAthleteId],
      });
      toast({
        title: "Período excluído",
        description: "O período foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o período.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: PlanFormValues) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este período?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="title-periodization">
          Periodização - Objetivo do Atleta
        </h1>
        <p className="text-muted-foreground">Planeje períodos de treinamento</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Atleta</CardTitle>
          <CardDescription>
            Escolha um atleta para gerenciar a periodização
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedAthleteId}
            onValueChange={setSelectedAthleteId}
          >
            <SelectTrigger data-testid="select-athlete">
              <SelectValue placeholder="Selecione um atleta" />
            </SelectTrigger>
            <SelectContent>
              {athletes.map((athlete) => (
                <SelectItem key={athlete.id} value={athlete.id}>
                  {athlete.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {selectedAthleteId && (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Plano de Periodização</CardTitle>
                <CardDescription>
                  Configure os períodos de treinamento
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-testid="button-add-period"
                    disabled={!selectedAthleteId}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Período
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Novo Período</DialogTitle>
                    <DialogDescription>
                      Adicione um novo período de treinamento
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="period"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Período</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Preparatório, Competitivo..."
                                data-testid="input-period"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="mainFocus"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Foco Principal</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Resistência, Força..."
                                data-testid="input-main-focus"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="weeklyStructure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estrutura Semanal</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 3x treino, 2x descanso..."
                                data-testid="input-weekly-structure"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="volumeIntensity"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Volume / Intensidade</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Alto volume, média intensidade..."
                                data-testid="input-volume-intensity"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="observations"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Observações</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Observações específicas do período..."
                                data-testid="input-observations"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsDialogOpen(false)}
                        >
                          Cancelar
                        </Button>
                        <Button
                          type="submit"
                          disabled={createMutation.isPending}
                          data-testid="button-submit-period"
                        >
                          {createMutation.isPending
                            ? "Salvando..."
                            : "Salvar Período"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {plansLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando períodos...
                </div>
              ) : plans.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground"
                  data-testid="text-no-plans"
                >
                  Nenhum período cadastrado. Clique em "Adicionar Período" para
                  começar.
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/50">
                      <TableRow>
                        <TableHead className="font-bold">Período</TableHead>
                        <TableHead className="font-bold">
                          Foco Principal
                        </TableHead>
                        <TableHead className="font-bold">
                          Estrutura Semanal
                        </TableHead>
                        <TableHead className="font-bold">
                          Volume / Intensidade
                        </TableHead>
                        <TableHead className="font-bold">Observações</TableHead>
                        <TableHead className="w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {plans.map((plan) => (
                        <TableRow key={plan.id} data-testid="row-plan">
                          <TableCell className="font-medium">
                            {plan.period}
                          </TableCell>
                          <TableCell>{plan.mainFocus}</TableCell>
                          <TableCell>{plan.weeklyStructure || "-"}</TableCell>
                          <TableCell>{plan.volumeIntensity || "-"}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {plan.observations || "-"}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(plan.id)}
                              data-testid="button-delete-plan"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações Gerais da Periodização</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Digite aqui observações gerais sobre a periodização do atleta..."
                value={generalObservations}
                onChange={(e) => setGeneralObservations(e.target.value)}
                className="min-h-[200px]"
                data-testid="textarea-general-observations"
              />
              <div className="flex justify-end mt-4">
                <Button
                  onClick={() => {
                    toast({
                      title: "Observações salvas",
                      description:
                        "As observações gerais foram salvas com sucesso.",
                    });
                  }}
                  data-testid="button-save-general-observations"
                >
                  Salvar Observações Gerais
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
