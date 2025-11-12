import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { TestForm } from "@/components/TestForm";
import { TestResultCard } from "@/components/TestResultCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Test {
  id: string;
  athleteId: string;
  athleteName: string;
  testDate: string;
  cmj: string;
  sj: string;
  observations: string | null;
}

interface Athlete {
  id: string;
  name: string;
  age: number;
  sport: string;
}

export default function Tests() {
  const { toast } = useToast();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const { data: tests = [] } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
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

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="title-tests">
          Testes CMJ/SJ
        </h1>
        <p className="text-muted-foreground">
          Gerencie os testes de salto dos atletas
        </p>
      </div>

      <Tabs defaultValue="register" className="space-y-4">
        <TabsList>
          <TabsTrigger value="register" data-testid="tab-register-test">
            Registrar Teste
          </TabsTrigger>
          <TabsTrigger value="results" data-testid="tab-view-results">
            Ver Resultados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Novo Teste</CardTitle>
              <CardDescription>Registre um novo teste CMJ/SJ</CardDescription>
            </CardHeader>
            <CardContent>
              <TestForm athletes={athletes} onSubmit={handleAddTest} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Resultados dos Testes</CardTitle>
                <CardDescription>Últimos testes registrados</CardDescription>
              </CardHeader>
              <CardContent>
                {tests.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhum teste registrado ainda
                  </p>
                ) : (
                  <div className="space-y-4">
                    {tests.slice(0, 5).map((test) => (
                      <div key={test.id} className="relative">
                        <TestResultCard
                          athleteName={test.athleteName}
                          date={test.testDate}
                          cmj={parseFloat(test.cmj)}
                          sj={parseFloat(test.sj)}
                          observations={test.observations || undefined}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2"
                          onClick={() => setSelectedAthleteId(test.athleteId)}
                          data-testid={`button-view-chart-${test.id}`}
                        >
                          Ver Gráfico
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Evolução de Performance</CardTitle>
                <CardDescription>Gráfico de progresso</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedAthleteId && (
                  <PerformanceChart data={getAthleteTests(selectedAthleteId)} />
                )}
                {!selectedAthleteId && (
                  <p
                    className="text-center text-muted-foreground py-8"
                    data-testid="text-select-athlete"
                  >
                    Clique em "Ver Gráfico" em um teste para visualizar a
                    evolução
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
