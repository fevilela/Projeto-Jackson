import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Activity,
  LogOut,
  BarChart3,
  Dumbbell,
  Footprints,
  Calendar,
  FileText,
  ClipboardList,
  User,
  Download,
  Loader2,
} from "lucide-react";
import { generateAthleteReport } from "@/lib/generateAthleteReport";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AthleteInfo {
  id: string;
  name: string;
  email: string;
  sport: string;
  age: number;
}

export default function AthleteDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [athlete, setAthlete] = useState<AthleteInfo | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);

  const handleDownloadReport = async () => {
    if (!athlete) return;

    setIsDownloadingPdf(true);
    try {
      await generateAthleteReport("self");
      toast({
        title: "PDF gerado!",
        description: "Seu relatório foi baixado com sucesso.",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível gerar o relatório. Tente novamente.",
      });
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/athlete/auth/me", {
        credentials: "include",
      });
      if (!response.ok) {
        setLocation("/atleta/login");
        return;
      }
      const data = await response.json();
      setAthlete(data);
    } catch (error) {
      setLocation("/atleta/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest("POST", "/api/athlete/auth/logout");
      toast({
        title: "Logout realizado",
        description: "Até logo!",
      });
      setLocation("/atleta/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const { data: tests = [], isLoading: testsLoading } = useQuery({
    queryKey: ["/api/athlete/tests"],
    enabled: !!athlete,
  });

  const { data: runningWorkouts = [], isLoading: workoutsLoading } = useQuery({
    queryKey: ["/api/athlete/running-workouts"],
    enabled: !!athlete,
  });

  const { data: runningPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["/api/athlete/running-plans"],
    enabled: !!athlete,
  });

  const { data: periodizationPlans = [], isLoading: periodLoading } = useQuery({
    queryKey: ["/api/athlete/periodization-plans"],
    enabled: !!athlete,
  });

  const { data: strengthExercises = [], isLoading: strengthLoading } = useQuery(
    {
      queryKey: ["/api/athlete/strength-exercises"],
      enabled: !!athlete,
    }
  );

  const { data: anamnesis = [], isLoading: anamnesisLoading } = useQuery({
    queryKey: ["/api/athlete/anamnesis"],
    enabled: !!athlete,
  });

  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/athlete/functional-assessments"],
    enabled: !!athlete,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Activity className="h-12 w-12 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!athlete) {
    return null;
  }

  const chartData = (tests as any[])
    .map((test: any) => ({
      date: format(new Date(test.testDate), "dd/MM", { locale: ptBR }),
      cmj: parseFloat(test.cmj),
      sj: parseFloat(test.sj),
    }))
    .reverse();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-xl font-bold">Área do Atleta</h1>
                <p className="text-sm text-muted-foreground">
                  Olá, {athlete.name}!
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{athlete.sport}</Badge>
              <Button
                variant="default"
                size="sm"
                onClick={handleDownloadReport}
                disabled={isDownloadingPdf}
                data-testid="button-download-pdf"
              >
                {isDownloadingPdf ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Download className="h-4 w-4 mr-2" />
                )}
                Baixar PDF
              </Button>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                data-testid="button-athlete-logout"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
            <TabsTrigger value="overview" data-testid="tab-overview">
              <BarChart3 className="h-4 w-4 mr-2 hidden sm:inline" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="tests" data-testid="tab-tests">
              <Activity className="h-4 w-4 mr-2 hidden sm:inline" />
              Testes
            </TabsTrigger>
            <TabsTrigger value="running" data-testid="tab-running">
              <Footprints className="h-4 w-4 mr-2 hidden sm:inline" />
              Corrida
            </TabsTrigger>
            <TabsTrigger value="strength" data-testid="tab-strength">
              <Dumbbell className="h-4 w-4 mr-2 hidden sm:inline" />
              Força
            </TabsTrigger>
            <TabsTrigger value="periodization" data-testid="tab-periodization">
              <Calendar className="h-4 w-4 mr-2 hidden sm:inline" />
              Periodização
            </TabsTrigger>
            <TabsTrigger value="assessments" data-testid="tab-assessments">
              <ClipboardList className="h-4 w-4 mr-2 hidden sm:inline" />
              Avaliações
            </TabsTrigger>
            <TabsTrigger value="anamnesis" data-testid="tab-anamnesis">
              <FileText className="h-4 w-4 mr-2 hidden sm:inline" />
              Anamnese
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Testes</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(tests as any[]).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    testes realizados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Treinos Corrida
                  </CardTitle>
                  <Footprints className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(runningWorkouts as any[]).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    treinos programados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Exercícios Força
                  </CardTitle>
                  <Dumbbell className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(strengthExercises as any[]).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    exercícios cadastrados
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Avaliações
                  </CardTitle>
                  <ClipboardList className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {(assessments as any[]).length}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    avaliações funcionais
                  </p>
                </CardContent>
              </Card>
            </div>

            {chartData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Evolução dos Testes de Salto</CardTitle>
                  <CardDescription>CMJ e SJ ao longo do tempo</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="cmj"
                          stroke="hsl(var(--primary))"
                          name="CMJ (cm)"
                          strokeWidth={2}
                        />
                        <Line
                          type="monotone"
                          dataKey="sj"
                          stroke="hsl(var(--chart-2))"
                          name="SJ (cm)"
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="tests" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Testes</CardTitle>
                <CardDescription>Todos os seus testes de salto</CardDescription>
              </CardHeader>
              <CardContent>
                {testsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (tests as any[]).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum teste registrado ainda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(tests as any[]).map((test: any) => (
                      <div
                        key={test.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div>
                          <p className="font-medium">
                            {format(
                              new Date(test.testDate),
                              "dd 'de' MMMM 'de' yyyy",
                              { locale: ptBR }
                            )}
                          </p>
                          {test.observations && (
                            <p className="text-sm text-muted-foreground">
                              {test.observations}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-4">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-primary">
                              {test.cmj}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              CMJ (cm)
                            </p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold">{test.sj}</p>
                            <p className="text-xs text-muted-foreground">
                              SJ (cm)
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="running" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Treinos de Corrida</CardTitle>
                <CardDescription>Seus treinos programados</CardDescription>
              </CardHeader>
              <CardContent>
                {workoutsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (runningWorkouts as any[]).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum treino programado ainda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(runningWorkouts as any[]).map((workout: any) => (
                      <div key={workout.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge>Semana {workout.weekNumber}</Badge>
                          <span className="text-sm text-muted-foreground">
                            {workout.dayName}
                          </span>
                        </div>
                        <p className="font-medium">{workout.training}</p>
                        {workout.distance && (
                          <p className="text-sm text-muted-foreground">
                            Distância: {workout.distance}
                          </p>
                        )}
                        {workout.observations && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {workout.observations}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {(runningPlans as any[]).length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Planos de Corrida (VO2)</CardTitle>
                  <CardDescription>Seus ritmos calculados</CardDescription>
                </CardHeader>
                <CardContent>
                  {(runningPlans as any[]).map((plan: any) => (
                    <div key={plan.id} className="p-4 border rounded-lg mb-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {plan.vo1 && (
                          <div>
                            <p className="text-sm text-muted-foreground">VO1</p>
                            <p className="font-medium">{plan.vo1}</p>
                          </div>
                        )}
                        {plan.vo2 && (
                          <div>
                            <p className="text-sm text-muted-foreground">VO2</p>
                            <p className="font-medium">{plan.vo2}</p>
                          </div>
                        )}
                        {plan.vo2lt && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              VO2 Limiar
                            </p>
                            <p className="font-medium">{plan.vo2lt}</p>
                          </div>
                        )}
                        {plan.vo2Dmax && (
                          <div>
                            <p className="text-sm text-muted-foreground">
                              VO2 Dmax
                            </p>
                            <p className="font-medium">{plan.vo2Dmax}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="strength" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Treino de Força</CardTitle>
                <CardDescription>Seus exercícios programados</CardDescription>
              </CardHeader>
              <CardContent>
                {strengthLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (strengthExercises as any[]).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhum exercício cadastrado ainda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(strengthExercises as any[]).map((exercise: any) => (
                      <div key={exercise.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge variant="outline">{exercise.block}</Badge>
                        </div>
                        <p className="font-medium">{exercise.exercise}</p>
                        <div className="flex gap-4 mt-2 text-sm">
                          <span>Séries: {exercise.sets}</span>
                          <span>Reps: {exercise.reps}</span>
                        </div>
                        {exercise.observations && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {exercise.observations}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="periodization" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Periodização</CardTitle>
                <CardDescription>Seu planejamento de treino</CardDescription>
              </CardHeader>
              <CardContent>
                {periodLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (periodizationPlans as any[]).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma periodização cadastrada ainda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(periodizationPlans as any[]).map((plan: any) => (
                      <div key={plan.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <Badge>{plan.period}</Badge>
                        </div>
                        <p className="font-medium">{plan.mainFocus}</p>
                        {plan.weeklyStructure && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Estrutura: {plan.weeklyStructure}
                          </p>
                        )}
                        {plan.volumeIntensity && (
                          <p className="text-sm text-muted-foreground">
                            Volume/Intensidade: {plan.volumeIntensity}
                          </p>
                        )}
                        {plan.observations && (
                          <p className="text-sm text-muted-foreground">
                            {plan.observations}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assessments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Avaliações Funcionais</CardTitle>
                <CardDescription>Suas avaliações de movimento</CardDescription>
              </CardHeader>
              <CardContent>
                {assessmentsLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (assessments as any[]).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma avaliação registrada ainda
                  </p>
                ) : (
                  <div className="space-y-3">
                    {(assessments as any[]).map((assessment: any) => (
                      <div
                        key={assessment.id}
                        className="p-4 border rounded-lg"
                      >
                        <p className="font-medium mb-2">
                          {format(
                            new Date(assessment.assessmentDate),
                            "dd 'de' MMMM 'de' yyyy",
                            { locale: ptBR }
                          )}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          {assessment.ankMobility && (
                            <div>
                              <span className="text-muted-foreground">
                                Tornozelo:
                              </span>{" "}
                              {assessment.ankMobility}
                            </div>
                          )}
                          {assessment.hipMobility && (
                            <div>
                              <span className="text-muted-foreground">
                                Quadril:
                              </span>{" "}
                              {assessment.hipMobility}
                            </div>
                          )}
                          {assessment.thoracicMobility && (
                            <div>
                              <span className="text-muted-foreground">
                                Torácica:
                              </span>{" "}
                              {assessment.thoracicMobility}
                            </div>
                          )}
                          {assessment.coreStability && (
                            <div>
                              <span className="text-muted-foreground">
                                Core:
                              </span>{" "}
                              {assessment.coreStability}
                            </div>
                          )}
                          {assessment.squatPattern && (
                            <div>
                              <span className="text-muted-foreground">
                                Agachamento:
                              </span>{" "}
                              {assessment.squatPattern}
                            </div>
                          )}
                          {assessment.lungePattern && (
                            <div>
                              <span className="text-muted-foreground">
                                Avanço:
                              </span>{" "}
                              {assessment.lungePattern}
                            </div>
                          )}
                        </div>
                        {assessment.generalObservations && (
                          <p className="text-sm text-muted-foreground mt-2">
                            {assessment.generalObservations}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="anamnesis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Anamnese</CardTitle>
                <CardDescription>Seu histórico de saúde</CardDescription>
              </CardHeader>
              <CardContent>
                {anamnesisLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (anamnesis as any[]).length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">
                    Nenhuma anamnese registrada ainda
                  </p>
                ) : (
                  <div className="space-y-4">
                    {(anamnesis as any[]).map((item: any) => (
                      <div
                        key={item.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <p className="font-medium">
                          {format(
                            new Date(item.anamnesisDate),
                            "dd 'de' MMMM 'de' yyyy",
                            { locale: ptBR }
                          )}
                        </p>

                        {item.mainGoal && (
                          <div>
                            <p className="text-sm font-medium">
                              Objetivo Principal
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.mainGoal}
                            </p>
                          </div>
                        )}

                        {item.medicalHistory && (
                          <div>
                            <p className="text-sm font-medium">
                              Histórico Médico
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.medicalHistory}
                            </p>
                          </div>
                        )}

                        {item.injuries && (
                          <div>
                            <p className="text-sm font-medium">Lesões</p>
                            <p className="text-sm text-muted-foreground">
                              {item.injuries}
                            </p>
                          </div>
                        )}

                        {item.lifestyle && (
                          <div>
                            <p className="text-sm font-medium">
                              Estilo de Vida
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.lifestyle}
                            </p>
                          </div>
                        )}

                        {item.currentActivityLevel && (
                          <div>
                            <p className="text-sm font-medium">
                              Nível de Atividade Atual
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {item.currentActivityLevel}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
