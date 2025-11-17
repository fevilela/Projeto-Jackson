import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus, ChevronDown } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const [tfExplanation, setTfExplanation] = useState("");
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  const [testDistance, setTestDistance] = useState("3200");
  const [testMinutes, setTestMinutes] = useState("");
  const [testSeconds, setTestSeconds] = useState("");
  const [calculatedResults, setCalculatedResults] = useState<any>(null);

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
      setTfExplanation(currentPlan.tfExplanation || "");

      if (
        currentPlan.vo1 ||
        currentPlan.vo2 ||
        currentPlan.vo2lt ||
        currentPlan.vo2Dmax
      ) {
        const loadedResults = {
          iatKmH: currentPlan.vo1 || "",
          velocidadePicoKmH: currentPlan.vo2 || "",
          velocidadeLTKmH: currentPlan.vo2lt || "",
          vo2max: currentPlan.vo2Dmax || "",
        };
        setCalculatedResults(loadedResults);
      } else {
        setCalculatedResults(null);
      }
    } else {
      setStartDate("");
      setTfExplanation("");
      setCalculatedResults(null);
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
      if (!calculatedResults) {
        throw new Error("Calcule os valores primeiro");
      }

      const planData = {
        athleteId: selectedAthleteId,
        startDate: startDate || null,
        vo1: calculatedResults.iatKmH || null,
        vo2: calculatedResults.velocidadePicoKmH || null,
        vo2lt: calculatedResults.velocidadeLTKmH || null,
        vo2Dmax: calculatedResults.vo2max || null,
        tfExplanation: tfExplanation || null,
      };

      const response = await apiRequest("POST", "/api/running-plans", planData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/running-plans/athlete", selectedAthleteId],
      });
      toast({
        title: "Plano salvo no histórico!",
        description: "Um novo plano foi adicionado ao histórico com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível salvar o plano.",
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

  const groupedWorkouts = workouts.reduce((acc, workout) => {
    const week = workout.weekNumber;
    if (!acc[week]) {
      acc[week] = [];
    }
    acc[week].push(workout);
    return acc;
  }, {} as Record<number, RunningWorkout[]>);

  const calculateVO2MaxTrainedMen = () => {
    if (!testMinutes || !testSeconds) {
      toast({
        title: "Erro",
        description: "Preencha minutos e segundos",
        variant: "destructive",
      });
      return;
    }

    const distance = parseFloat(testDistance);
    const minutes = parseFloat(testMinutes);
    const seconds = parseFloat(testSeconds);
    const totalMinutes = minutes + seconds / 60;

    const velocidadeMedia = distance / totalMinutes;
    const velocidadeKmH = velocidadeMedia * 0.06;
    const iat = velocidadeMedia * 0.892;
    const iatKmH = iat * 0.06;
    const paceIAT = 60 / iatKmH;

    const vo2max = 0.0193 * velocidadeMedia + 4.374;
    const vo2_4mM = vo2max * 0.886;
    const vo2_25mM = vo2_4mM * 1.009;
    const vo2_2mM = vo2_25mM * 0.908;

    const velocidadePico = velocidadeMedia * 0.99;
    const velocidadePicoKmH = velocidadePico * 0.06;
    const pacePico = 60 / velocidadePicoKmH;

    const velocidadeLT = iat * 0.658;
    const velocidadeLTKmH = velocidadeLT * 0.06;
    const paceLT = 60 / velocidadeLTKmH;
    const vo2LT = vo2_2mM * 0.844;

    setCalculatedResults({
      velocidadeMedia: velocidadeMedia.toFixed(2),
      velocidadeKmH: velocidadeKmH.toFixed(2),
      iat: iat.toFixed(2),
      iatKmH: iatKmH.toFixed(2),
      paceIAT: paceIAT.toFixed(2),
      vo2max: vo2max.toFixed(2),
      vo2_4mM: vo2_4mM.toFixed(2),
      vo2_25mM: vo2_25mM.toFixed(2),
      vo2_2mM: vo2_2mM.toFixed(2),
      velocidadePico: velocidadePico.toFixed(2),
      velocidadePicoKmH: velocidadePicoKmH.toFixed(2),
      pacePico: pacePico.toFixed(2),
      velocidadeLT: velocidadeLT.toFixed(2),
      velocidadeLTKmH: velocidadeLTKmH.toFixed(2),
      paceLT: paceLT.toFixed(2),
      vo2LT: vo2LT.toFixed(2),
    });

    toast({
      title: "Calculado!",
      description: "Valores calculados com sucesso.",
    });
  };

  const calculateVO2MaxUntrained = () => {
    if (!testMinutes || !testSeconds) {
      toast({
        title: "Erro",
        description: "Preencha minutos e segundos",
        variant: "destructive",
      });
      return;
    }

    const distance = parseFloat(testDistance);
    const minutes = parseFloat(testMinutes);
    const seconds = parseFloat(testSeconds);
    const totalMinutes = minutes + seconds / 60;

    const velocidadeMedia = distance / totalMinutes;
    const velocidadeKmH = velocidadeMedia * 0.06;
    const iat = velocidadeMedia * 0.862;
    const iatKmH = iat * 0.06;
    const paceIAT = 60 / iatKmH;

    const vo2max = 0.0193 * velocidadeMedia + 4.374;
    const vo2_4mM = vo2max * 0.899;
    const vo2_25mM = vo2_4mM * 0.883;
    const vo2_2mM = vo2_25mM * 0.939;

    const velocidadePico = velocidadeMedia * 1.152;
    const velocidadePicoKmH = velocidadePico * 0.06;
    const pacePico = 60 / velocidadePicoKmH;

    const velocidadeLT = iat * 0.748;
    const velocidadeLTKmH = velocidadeLT * 0.06;
    const paceLT = 60 / velocidadeLTKmH;
    const vo2LT = vo2_2mM * 0.776;

    setCalculatedResults({
      velocidadeMedia: velocidadeMedia.toFixed(2),
      velocidadeKmH: velocidadeKmH.toFixed(2),
      iat: iat.toFixed(2),
      iatKmH: iatKmH.toFixed(2),
      paceIAT: paceIAT.toFixed(2),
      vo2max: vo2max.toFixed(2),
      vo2_4mM: vo2_4mM.toFixed(2),
      vo2_25mM: vo2_25mM.toFixed(2),
      vo2_2mM: vo2_2mM.toFixed(2),
      velocidadePico: velocidadePico.toFixed(2),
      velocidadePicoKmH: velocidadePicoKmH.toFixed(2),
      pacePico: pacePico.toFixed(2),
      velocidadeLT: velocidadeLT.toFixed(2),
      velocidadeLTKmH: velocidadeLTKmH.toFixed(2),
      paceLT: paceLT.toFixed(2),
      vo2LT: vo2LT.toFixed(2),
    });

    toast({
      title: "Calculado!",
      description: "Valores calculados com sucesso.",
    });
  };

  const calculateIAT = () => {
    if (!testMinutes || !testSeconds) {
      toast({
        title: "Erro",
        description: "Preencha minutos e segundos",
        variant: "destructive",
      });
      return;
    }

    const distance = parseFloat(testDistance);
    const minutes = parseFloat(testMinutes);
    const seconds = parseFloat(testSeconds);
    const totalMinutes = minutes + seconds / 60;

    const velocidadeMedia = distance / totalMinutes;
    const iat = velocidadeMedia * 0.879;
    const iatKmH = iat * 0.06;

    setCalculatedResults({
      velocidadeMedia: velocidadeMedia.toFixed(2),
      iat: iat.toFixed(2),
      iatKmH: iatKmH.toFixed(2),
    });

    toast({
      title: "Calculado!",
      description:
        "IAT calculado com sucesso. Para testes completos use as abas de Homens Treinados ou Destreinados.",
    });
  };

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

            <div>
              <label className="text-sm font-medium">Explicação dos TF:</label>
              <Textarea
                value={tfExplanation}
                onChange={(e) => setTfExplanation(e.target.value)}
                placeholder="Digite a explicação dos tipos de treino (TF)..."
                className="mt-1"
                data-testid="textarea-tf-explanation"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {selectedAthleteId && (
        <Card>
          <CardHeader>
            <CardTitle>Calculadora de VO2max e Limiares</CardTitle>
            <CardDescription>
              Calcule VO2max e limiares baseado em testes de corrida e salve no
              plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="trained" className="space-y-4">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="trained" data-testid="tab-trained">
                  Homens Treinados
                </TabsTrigger>
                <TabsTrigger value="untrained" data-testid="tab-untrained">
                  Mulheres/Homens Destreinados
                </TabsTrigger>
                <TabsTrigger value="iat" data-testid="tab-iat">
                  IAT
                </TabsTrigger>
              </TabsList>

              <TabsContent value="trained" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Distância (m)</label>
                    <Input
                      type="number"
                      value={testDistance}
                      onChange={(e) => setTestDistance(e.target.value)}
                      placeholder="3200"
                      data-testid="input-distance-trained"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Minutos</label>
                    <Input
                      type="number"
                      value={testMinutes}
                      onChange={(e) => setTestMinutes(e.target.value)}
                      placeholder="15"
                      data-testid="input-minutes-trained"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Segundos</label>
                    <Input
                      type="number"
                      value={testSeconds}
                      onChange={(e) => setTestSeconds(e.target.value)}
                      placeholder="47"
                      data-testid="input-seconds-trained"
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={calculateVO2MaxTrainedMen}
                  data-testid="button-calculate-trained"
                  className="w-full"
                >
                  Calcular
                </Button>

                {calculatedResults && (
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                    <h3 className="font-bold text-lg">
                      {calculatedResults.vo2_4mM
                        ? "Resultados Calculados"
                        : "Valores Salvos"}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {calculatedResults.velocidadeMedia && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Velocidade Média
                          </p>
                          <p
                            className="font-semibold"
                            data-testid="result-vel-media"
                          >
                            {calculatedResults.velocidadeMedia} m/min (
                            {calculatedResults.velocidadeKmH} km/h)
                          </p>
                        </div>
                      )}
                      {calculatedResults.vo2max && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            VO2max
                          </p>
                          <p
                            className="font-semibold"
                            data-testid="result-vo2max"
                          >
                            {calculatedResults.vo2max} ml/min/kg
                          </p>
                        </div>
                      )}
                      {calculatedResults.velocidadeLTKmH && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-green-600 text-white">
                              LT
                            </Badge>
                            <p className="text-sm font-medium text-green-900">
                              Velocidade LT
                            </p>
                          </div>
                          <p className="font-semibold text-green-900">
                            {calculatedResults.velocidadeLTKmH} km/h
                            {calculatedResults.paceLT &&
                              ` (Pace: ${calculatedResults.paceLT} min/km)`}
                          </p>
                        </div>
                      )}
                      {calculatedResults.iatKmH && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-purple-600 text-white">
                              IAT
                            </Badge>
                            <p className="text-sm font-medium text-purple-900">
                              Limiar Anaeróbio
                            </p>
                          </div>
                          <p
                            className="font-semibold text-purple-900"
                            data-testid="result-iat"
                          >
                            {calculatedResults.iat
                              ? `${calculatedResults.iat} m/min (${calculatedResults.iatKmH} km/h)`
                              : `${calculatedResults.iatKmH} km/h`}
                            {calculatedResults.paceIAT &&
                              ` (Pace: ${calculatedResults.paceIAT} min/km)`}
                          </p>
                        </div>
                      )}
                      {calculatedResults.velocidadePicoKmH && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-yellow-600 text-white">
                              Vpico
                            </Badge>
                            <p className="text-sm font-medium text-yellow-900">
                              Velocidade Pico
                            </p>
                          </div>
                          <p className="font-semibold text-yellow-900">
                            {calculatedResults.velocidadePicoKmH} km/h
                            {calculatedResults.pacePico &&
                              ` (Pace: ${calculatedResults.pacePico} min/km)`}
                          </p>
                        </div>
                      )}
                      {calculatedResults.vo2_4mM && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              VO2 4.0mM
                            </p>
                            <p className="font-semibold">
                              {calculatedResults.vo2_4mM} ml/min/kg
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              VO2 2.5mM
                            </p>
                            <p className="font-semibold">
                              {calculatedResults.vo2_25mM} ml/min/kg
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              VO2 2.0mM
                            </p>
                            <p className="font-semibold">
                              {calculatedResults.vo2_2mM} ml/min/kg
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              VO2 LT
                            </p>
                            <p className="font-semibold">
                              {calculatedResults.vo2LT} ml/min/kg
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {!calculatedResults.vo2_4mM && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Calcule novamente para ver todos os detalhes
                      </p>
                    )}
                    <Button
                      onClick={() => savePlanMutation.mutate()}
                      disabled={savePlanMutation.isPending}
                      data-testid="button-save-to-plan-trained"
                      className="w-full mt-4"
                    >
                      {savePlanMutation.isPending
                        ? "Salvando..."
                        : "Salvar no Histórico"}
                    </Button>
                  </div>
                )}

                {calculatedResults && (
                  <div className="mt-4 space-y-3">
                    <h3 className="font-semibold text-base">
                      Zonas de Treinamento:
                    </h3>
                    <div className="space-y-2">
                      <div className="p-3 bg-green-100 border-l-4 border-green-600 rounded">
                        <p className="font-semibold text-green-900">
                          Limiar de lactato (LT)
                        </p>
                        <p className="text-sm text-green-800">
                          Momento onde o lactato começa ficar mais alto do que
                          em repouso = 0 indivíduo consegue manter essa
                          intensidade por horas
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 border-l-4 border-purple-600 rounded">
                        <p className="font-semibold text-purple-900">
                          Limiar anaeróbio (IAT)
                        </p>
                        <p className="text-sm text-purple-800">
                          Aumento exponencial do lactato no sangue em níveis de
                          restrição. Consegue manter essa intensidade por
                          aproximadamente 30-40 minutos
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-100 border-l-4 border-yellow-600 rounded">
                        <p className="font-semibold text-yellow-900">
                          Velocidade aeróbia max (Vpico)
                        </p>
                        <p className="text-sm text-yellow-800">
                          Velocidade aeróbia máxima do indivíduo, é possível
                          manter essa intensidade por aproximadamente por 4-5
                          minutos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="untrained" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Distância (m)</label>
                    <Input
                      type="number"
                      value={testDistance}
                      onChange={(e) => setTestDistance(e.target.value)}
                      placeholder="3200"
                      data-testid="input-distance-untrained"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Minutos</label>
                    <Input
                      type="number"
                      value={testMinutes}
                      onChange={(e) => setTestMinutes(e.target.value)}
                      placeholder="22"
                      data-testid="input-minutes-untrained"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Segundos</label>
                    <Input
                      type="number"
                      value={testSeconds}
                      onChange={(e) => setTestSeconds(e.target.value)}
                      placeholder="0"
                      data-testid="input-seconds-untrained"
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={calculateVO2MaxUntrained}
                  data-testid="button-calculate-untrained"
                  className="w-full"
                >
                  Calcular
                </Button>

                {calculatedResults && (
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                    <h3 className="font-bold text-lg">
                      {calculatedResults.vo2_4mM
                        ? "Resultados Calculados"
                        : "Valores Salvos"}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {calculatedResults.velocidadeMedia && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            Velocidade Média
                          </p>
                          <p
                            className="font-semibold"
                            data-testid="result-vel-media"
                          >
                            {calculatedResults.velocidadeMedia} m/min (
                            {calculatedResults.velocidadeKmH} km/h)
                          </p>
                        </div>
                      )}
                      {calculatedResults.vo2max && (
                        <div>
                          <p className="text-sm text-muted-foreground">
                            VO2max
                          </p>
                          <p
                            className="font-semibold"
                            data-testid="result-vo2max"
                          >
                            {calculatedResults.vo2max} ml/min/kg
                          </p>
                        </div>
                      )}
                      {calculatedResults.velocidadeLTKmH && (
                        <div className="p-3 bg-green-50 border border-green-200 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-green-600 text-white">
                              LT
                            </Badge>
                            <p className="text-sm font-medium text-green-900">
                              Velocidade LT
                            </p>
                          </div>
                          <p className="font-semibold text-green-900">
                            {calculatedResults.velocidadeLTKmH} km/h
                            {calculatedResults.paceLT &&
                              ` (Pace: ${calculatedResults.paceLT} min/km)`}
                          </p>
                        </div>
                      )}
                      {calculatedResults.iatKmH && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-purple-600 text-white">
                              IAT
                            </Badge>
                            <p className="text-sm font-medium text-purple-900">
                              Limiar Anaeróbio
                            </p>
                          </div>
                          <p
                            className="font-semibold text-purple-900"
                            data-testid="result-iat"
                          >
                            {calculatedResults.iat
                              ? `${calculatedResults.iat} m/min (${calculatedResults.iatKmH} km/h)`
                              : `${calculatedResults.iatKmH} km/h`}
                            {calculatedResults.paceIAT &&
                              ` (Pace: ${calculatedResults.paceIAT} min/km)`}
                          </p>
                        </div>
                      )}
                      {calculatedResults.velocidadePicoKmH && (
                        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-yellow-600 text-white">
                              Vpico
                            </Badge>
                            <p className="text-sm font-medium text-yellow-900">
                              Velocidade Pico
                            </p>
                          </div>
                          <p className="font-semibold text-yellow-900">
                            {calculatedResults.velocidadePicoKmH} km/h
                            {calculatedResults.pacePico &&
                              ` (Pace: ${calculatedResults.pacePico} min/km)`}
                          </p>
                        </div>
                      )}
                      {calculatedResults.vo2_4mM && (
                        <>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              VO2 4.0mM
                            </p>
                            <p className="font-semibold">
                              {calculatedResults.vo2_4mM} ml/min/kg
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              VO2 2.5mM
                            </p>
                            <p className="font-semibold">
                              {calculatedResults.vo2_25mM} ml/min/kg
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              VO2 2.0mM
                            </p>
                            <p className="font-semibold">
                              {calculatedResults.vo2_2mM} ml/min/kg
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              VO2 LT
                            </p>
                            <p className="font-semibold">
                              {calculatedResults.vo2LT} ml/min/kg
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                    {!calculatedResults.vo2_4mM && (
                      <p className="text-sm text-muted-foreground text-center py-2">
                        Calcule novamente para ver todos os detalhes
                      </p>
                    )}
                    <Button
                      onClick={() => savePlanMutation.mutate()}
                      disabled={savePlanMutation.isPending}
                      data-testid="button-save-to-plan-untrained"
                      className="w-full mt-4"
                    >
                      {savePlanMutation.isPending
                        ? "Salvando..."
                        : "Salvar no Histórico"}
                    </Button>
                  </div>
                )}

                {calculatedResults && (
                  <div className="mt-4 space-y-3">
                    <h3 className="font-semibold text-base">
                      Zonas de Treinamento:
                    </h3>
                    <div className="space-y-2">
                      <div className="p-3 bg-green-100 border-l-4 border-green-600 rounded">
                        <p className="font-semibold text-green-900">
                          Limiar de lactato (LT)
                        </p>
                        <p className="text-sm text-green-800">
                          Momento onde o lactato começa ficar mais alto do que
                          em repouso = 0 indivíduo consegue manter essa
                          intensidade por horas
                        </p>
                      </div>
                      <div className="p-3 bg-purple-100 border-l-4 border-purple-600 rounded">
                        <p className="font-semibold text-purple-900">
                          Limiar anaeróbio (IAT)
                        </p>
                        <p className="text-sm text-purple-800">
                          Aumento exponencial do lactato no sangue em níveis de
                          restrição. Consegue manter essa intensidade por
                          aproximadamente 30-40 minutos
                        </p>
                      </div>
                      <div className="p-3 bg-yellow-100 border-l-4 border-yellow-600 rounded">
                        <p className="font-semibold text-yellow-900">
                          Velocidade aeróbia max (Vpico)
                        </p>
                        <p className="text-sm text-yellow-800">
                          Velocidade aeróbia máxima do indivíduo, é possível
                          manter essa intensidade por aproximadamente por 4-5
                          minutos.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="iat" className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium">Distância (m)</label>
                    <Input
                      type="number"
                      value={testDistance}
                      onChange={(e) => setTestDistance(e.target.value)}
                      placeholder="3000"
                      data-testid="input-distance-iat"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Minutos</label>
                    <Input
                      type="number"
                      value={testMinutes}
                      onChange={(e) => setTestMinutes(e.target.value)}
                      placeholder="17"
                      data-testid="input-minutes-iat"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Segundos</label>
                    <Input
                      type="number"
                      value={testSeconds}
                      onChange={(e) => setTestSeconds(e.target.value)}
                      placeholder="19"
                      data-testid="input-seconds-iat"
                      className="mt-1"
                    />
                  </div>
                </div>

                <Button
                  onClick={calculateIAT}
                  data-testid="button-calculate-iat"
                  className="w-full"
                >
                  Calcular
                </Button>

                {calculatedResults && (
                  <div className="mt-4 p-4 bg-muted rounded-lg space-y-3">
                    <h3 className="font-bold text-lg">Resultados</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Velocidade Média
                        </p>
                        <p
                          className="font-semibold"
                          data-testid="result-vel-media"
                        >
                          {calculatedResults.velocidadeMedia} m/min
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">IAT</p>
                        <p className="font-semibold" data-testid="result-iat">
                          {calculatedResults.iat} m/min (
                          {calculatedResults.iatKmH} km/h)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {selectedAthleteId && plans.length > 0 && (
        <Card>
          <Collapsible open={isHistoryOpen} onOpenChange={setIsHistoryOpen}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Histórico de Planos Salvos</CardTitle>
                  <CardDescription>
                    Visualize todos os planos salvos para este atleta
                  </CardDescription>
                </div>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    data-testid="button-toggle-history"
                  >
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${
                        isHistoryOpen ? "rotate-180" : ""
                      }`}
                    />
                  </Button>
                </CollapsibleTrigger>
              </div>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <div className="space-y-4">
                  {plans.map((plan, index) => (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-lg border ${
                        index === 0
                          ? "bg-primary/5 border-primary"
                          : "bg-muted border-border"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">
                            {index === 0
                              ? "Plano Atual"
                              : `Plano ${plans.length - index}`}
                          </h4>
                          {plan.startDate && (
                            <span className="text-sm text-muted-foreground">
                              (Início:{" "}
                              {new Date(plan.startDate).toLocaleDateString(
                                "pt-BR"
                              )}
                              )
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Salvo em:{" "}
                          {new Date(plan.createdAt).toLocaleString("pt-BR")}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        {plan.vo2lt && (
                          <div>
                            <p className="text-muted-foreground">
                              Velocidade LT
                            </p>
                            <p className="font-semibold">{plan.vo2lt} km/h</p>
                          </div>
                        )}
                        {plan.vo1 && (
                          <div>
                            <p className="text-muted-foreground">IAT</p>
                            <p className="font-semibold">{plan.vo1} km/h</p>
                          </div>
                        )}
                        {plan.vo2 && (
                          <div>
                            <p className="text-muted-foreground">
                              Velocidade Pico
                            </p>
                            <p className="font-semibold">{plan.vo2} km/h</p>
                          </div>
                        )}
                        {plan.vo2Dmax && (
                          <div>
                            <p className="text-muted-foreground">VO2max</p>
                            <p className="font-semibold">
                              {plan.vo2Dmax} ml/min/kg
                            </p>
                          </div>
                        )}
                      </div>
                      {plan.tfExplanation && (
                        <div className="mt-3 pt-3 border-t">
                          <p className="text-xs text-muted-foreground mb-1">
                            Explicação dos TF:
                          </p>
                          <p className="text-sm">{plan.tfExplanation}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {selectedAthleteId && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Treinos Semanais</CardTitle>
              <CardDescription>Configure os treinos por semana</CardDescription>
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
                      <h3 className="font-bold text-lg bg-white text-black px-2 py-1">
                        Semana {weekNum}
                      </h3>
                      <div className="border rounded-lg overflow-hidden">
                        <Table>
                          <TableHeader className="bg-white">
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
      )}
    </div>
  );
}
