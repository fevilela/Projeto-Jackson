import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AthleteForm } from "@/components/AthleteForm";
import { TestForm } from "@/components/TestForm";
import { AthleteList } from "@/components/AthleteList";
import { TestResultCard } from "@/components/TestResultCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Activity, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";

interface Athlete {
  id: string;
  name: string;
  age: number;
  sport: string;
}

interface Test {
  id: string;
  athleteId: string;
  athleteName: string;
  testDate: string;
  cmj: string;
  sj: string;
  observations: string | null;
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();

  const { data: athletes = [], isLoading: athletesLoading } = useQuery<
    Athlete[]
  >({
    queryKey: ["/api/athletes"],
  });

  const { data: tests = [], isLoading: testsLoading } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  const createAthleteMutation = useMutation({
    mutationFn: async (data: { name: string; age: string; sport: string }) => {
      const response = await apiRequest("POST", "/api/athletes", {
        name: data.name,
        age: parseInt(data.age),
        sport: data.sport,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
      toast({
        title: "Sucesso!",
        description: "Atleta cadastrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao cadastrar atleta",
      });
    },
  });

  const createTestMutation = useMutation({
    mutationFn: async (data: {
      athleteId: string;
      date: string;
      cmj: string;
      sj: string;
      observations: string;
    }) => {
      const response = await apiRequest("POST", "/api/tests", {
        athleteId: data.athleteId,
        testDate: data.date,
        cmj: data.cmj,
        sj: data.sj,
        observations: data.observations || null,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tests"] });
      toast({
        title: "Sucesso!",
        description: "Teste registrado com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao registrar teste",
      });
    },
  });

  const handleAddAthlete = (athleteData: {
    name: string;
    age: string;
    sport: string;
  }) => {
    createAthleteMutation.mutate(athleteData);
  };

  const handleAddTest = (testData: {
    athleteId: string;
    date: string;
    cmj: string;
    sj: string;
    observations: string;
  }) => {
    createTestMutation.mutate(testData);
  };

  const getAthleteTests = (athleteId: string) => {
    return tests
      .filter((test) => test.athleteId === athleteId)
      .sort(
        (a, b) =>
          new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
      )
      .map((test) => ({
        date: test.testDate,
        cmj: parseFloat(test.cmj),
        sj: parseFloat(test.sj),
        difference:
          ((parseFloat(test.cmj) - parseFloat(test.sj)) / parseFloat(test.sj)) *
          100,
      }));
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">
                Sistema de Avaliação Física
              </h1>
              <p className="text-sm text-muted-foreground">
                Bem-vindo, {user?.username}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="tests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tests" data-testid="tab-tests">
              CMJ e SJ
            </TabsTrigger>
            <TabsTrigger value="athletes" data-testid="tab-athletes">
              Atletas
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">
              Análises
            </TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TestForm
                athletes={athletes.map((a) => ({ id: a.id, name: a.name }))}
                onSubmit={handleAddTest}
              />

              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Testes Recentes</h2>
                {testsLoading ? (
                  <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    <p>Carregando testes...</p>
                  </div>
                ) : tests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    <p>Nenhum teste registrado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {tests.slice(0, 10).map((test) => (
                      <TestResultCard
                        key={test.id}
                        athleteName={test.athleteName}
                        date={test.testDate}
                        cmj={parseFloat(test.cmj)}
                        sj={parseFloat(test.sj)}
                        observations={test.observations || undefined}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="athletes" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AthleteForm onSubmit={handleAddAthlete} />
              {athletesLoading ? (
                <div className="text-center py-12 text-muted-foreground border rounded-lg">
                  <p>Carregando atletas...</p>
                </div>
              ) : (
                <AthleteList
                  athletes={athletes.map((a) => ({
                    ...a,
                    age: a.age.toString(),
                  }))}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {athletesLoading || testsLoading ? (
              <div className="text-center py-12 text-muted-foreground border rounded-lg">
                <p>Carregando análises...</p>
              </div>
            ) : athletes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border rounded-lg">
                <p>
                  Cadastre atletas e registre testes para visualizar análises
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {athletes.map((athlete) => {
                  const athleteTests = getAthleteTests(athlete.id);
                  if (athleteTests.length === 0) return null;

                  return (
                    <div key={athlete.id} className="space-y-4">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <PerformanceChart
                          data={athleteTests}
                          athleteName={athlete.name}
                          type="line"
                        />
                        <PerformanceChart
                          data={athleteTests}
                          athleteName={athlete.name}
                          type="bar"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
