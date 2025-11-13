import { useState, useEffect } from "react";
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

interface RunningWorkout {
  id: string;
  athleteId: string;
  userId: string;
  weekNumber: number;
  dayOfWeek: number;
  dayName: string;
  training: string;
  distance: string | null;
  observations: string | null;
  startDate: string | null;
  createdAt: string;
}

interface RunningPlan {
  id: string;
  athleteId: string;
  userId: string;
  startDate: string | null;
  vo1: string | null;
  vo2: string | null;
  vo2lt: string | null;
  vo2Dmax: string | null;
  tfExplanation: string | null;
  createdAt: string;
}

const workoutFormSchema = z.object({
  weekNumber: z.string().min(1, "Número da semana é obrigatório"),
  dayName: z.string().min(1, "Dia é obrigatório"),
  training: z.string().min(1, "Treino é obrigatório"),
  distance: z.string().optional(),
  observations: z.string().optional(),
});

type WorkoutFormValues = z.infer<typeof workoutFormSchema>;

export default function Running() {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [vo1, setVo1] = useState("");
  const [vo2, setVo2] = useState("");
  const [vo2lt, setVo2lt] = useState("");
  const [vo2max, setVo2max] = useState("");
  const [tfExplanation, setTfExplanation] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api", "athletes"],
  });

  const selectedAthlete = athletes.find((a) => a.id === selectedAthleteId);

  const { data: plans = [] } = useQuery<RunningPlan[]>({
    queryKey: ["/api/running-plans/athlete", selectedAthleteId],
    enabled: !!selectedAthleteId,
  });

  const currentPlan = plans[0];

  useEffect(() => {
    if (currentPlan) {
      setStartDate(currentPlan.startDate || "");
      setVo1(currentPlan.vo1 || "");
      setVo2(currentPlan.vo2 || "");
      setVo2lt(currentPlan.vo2lt || "");
      setVo2max(currentPlan.vo2Dmax || "");
      setTfExplanation(currentPlan.tfExplanation || "");
    } else {
      setStartDate("");
      setVo1("");
      setVo2("");
      setVo2lt("");
      setVo2max("");
      setTfExplanation("");
    }
  }, [currentPlan]);

  const { data: workouts = [], isLoading: workoutsLoading } = useQuery<
    RunningWorkout[]
  >({
    queryKey: ["/api/running-workouts/athlete", selectedAthleteId],
    enabled: !!selectedAthleteId,
  });

  const form = useForm<WorkoutFormValues>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      weekNumber: "",
      dayName: "",
      training: "",
      distance: "",
      observations: "",
    },
  });

  const savePlanMutation = useMutation({
    mutationFn: async () => {
      const planData = {
        athleteId: selectedAthleteId,
        startDate: startDate || null,
        vo1: vo1 || null,
        vo2: vo2 || null,
        vo2lt: vo2lt || null,
        vo2Dmax: vo2max || null,
        tfExplanation: tfExplanation || null,
      };

      if (currentPlan) {
        const response = await apiRequest(
          "PATCH",
          `/api/running-plans/${currentPlan.id}`,
          planData
        );
        return response.json();
      } else {
        const response = await apiRequest(
          "POST",
          "/api/running-plans",
          planData
        );
        return response.json();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/running-plans/athlete", selectedAthleteId],
      });
      toast({
        title: "Plano salvo",
        description: "As informações do plano foram salvas com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o plano.",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: WorkoutFormValues) => {
      const response = await apiRequest("POST", "/api/running-workouts", {
        ...data,
        weekNumber: parseInt(data.weekNumber),
        dayOfWeek: 0,
        athleteId: selectedAthleteId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/running-workouts/athlete", selectedAthleteId],
      });
      toast({
        title: "Treino adicionado",
        description: "O treino foi adicionado com sucesso.",
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o treino.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/running-workouts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/running-workouts/athlete", selectedAthleteId],
      });
      toast({
        title: "Treino excluído",
        description: "O treino foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o treino.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: WorkoutFormValues) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este treino?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleSavePlan = () => {
    savePlanMutation.mutate();
  };

  const groupedWorkouts = workouts.reduce((acc, workout) => {
    const week = workout.weekNumber;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(workout);
    return acc;
  }, {} as Record<number, RunningWorkout[]>);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="title-running">
          Planilha de Corrida
        </h1>
        <p className="text-muted-foreground">
          Planeje treinos de corrida semanais
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Atleta</CardTitle>
          <CardDescription>
            Escolha um atleta para gerenciar o plano de corrida
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
            <CardHeader>
              <CardTitle>Informações do Plano</CardTitle>
              <CardDescription>
                Configure as informações gerais do plano de corrida
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Nome do atleta:</label>
                  <Input
                    value={selectedAthlete?.name || ""}
                    disabled
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Data do início:</label>
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="mt-1"
                    data-testid="input-start-date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="text-sm font-medium">VO1:</label>
                  <Input
                    value={vo1}
                    onChange={(e) => setVo1(e.target.value)}
                    placeholder="VO1"
                    className="mt-1"
                    data-testid="input-vo1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">VO2:</label>
                  <Input
                    value={vo2}
                    onChange={(e) => setVo2(e.target.value)}
                    placeholder="VO2"
                    className="mt-1"
                    data-testid="input-vo2"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">VO2lt:</label>
                  <Input
                    value={vo2lt}
                    onChange={(e) => setVo2lt(e.target.value)}
                    placeholder="VO2lt"
                    className="mt-1"
                    data-testid="input-vo2lt"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">VO2Dmax:</label>
                  <Input
                    value={vo2max}
                    onChange={(e) => setVo2max(e.target.value)}
                    placeholder="VO2Dmax"
                    className="mt-1"
                    data-testid="input-vo2max"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">
                  Explicação dos TF:
                </label>
                <Textarea
                  value={tfExplanation}
                  onChange={(e) => setTfExplanation(e.target.value)}
                  placeholder="Digite a explicação dos tipos de treino (TF)..."
                  className="mt-1"
                  data-testid="textarea-tf-explanation"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleSavePlan}
                  disabled={savePlanMutation.isPending}
                  data-testid="button-save-plan"
                >
                  {savePlanMutation.isPending
                    ? "Salvando..."
                    : "Salvar Informações do Plano"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Treinos Semanais</CardTitle>
                <CardDescription>
                  Configure os treinos por semana
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    data-testid="button-add-workout"
                    disabled={!selectedAthleteId}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Adicionar Treino
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Novo Treino</DialogTitle>
                    <DialogDescription>
                      Adicione um novo treino de corrida
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form
                      onSubmit={form.handleSubmit(onSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={form.control}
                        name="weekNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Semana</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="Ex: 1, 2, 3..."
                                data-testid="input-week-number"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="dayName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Dia</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: Segunda, Terça, Quarta..."
                                data-testid="input-day-name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="training"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Treino</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Descrição do treino..."
                                data-testid="input-training"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="distance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Distância</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 8km, 10km..."
                                data-testid="input-distance"
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
                              <Textarea
                                placeholder="Observações sobre o treino..."
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
                          data-testid="button-submit-workout"
                        >
                          {createMutation.isPending
                            ? "Salvando..."
                            : "Salvar Treino"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {workoutsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Carregando treinos...
                </div>
              ) : workouts.length === 0 ? (
                <div
                  className="text-center py-8 text-muted-foreground"
                  data-testid="text-no-workouts"
                >
                  Nenhum treino cadastrado. Clique em "Adicionar Treino" para
                  começar.
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.keys(groupedWorkouts)
                    .sort((a, b) => parseInt(a) - parseInt(b))
                    .map((weekNum) => (
                      <div key={weekNum} className="space-y-2">
                        <h3 className="font-bold text-lg bg-yellow-400 text-black px-2 py-1">
                          Semana {weekNum}
                        </h3>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader className="bg-yellow-400">
                              <TableRow>
                                <TableHead className="font-bold text-black">
                                  Dia
                                </TableHead>
                                <TableHead className="font-bold text-black">
                                  Treino
                                </TableHead>
                                <TableHead className="font-bold text-black">
                                  Distância
                                </TableHead>
                                <TableHead className="font-bold text-black">
                                  Observações
                                </TableHead>
                                <TableHead className="w-[80px]"></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {groupedWorkouts[parseInt(weekNum)].map(
                                (workout) => (
                                  <TableRow
                                    key={workout.id}
                                    data-testid="row-workout"
                                  >
                                    <TableCell className="font-medium">
                                      {workout.dayName}
                                    </TableCell>
                                    <TableCell>{workout.training}</TableCell>
                                    <TableCell>
                                      {workout.distance || "-"}
                                    </TableCell>
                                    <TableCell className="max-w-xs truncate">
                                      {workout.observations || "-"}
                                    </TableCell>
                                    <TableCell>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => handleDelete(workout.id)}
                                        data-testid="button-delete-workout"
                                      >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                )
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
