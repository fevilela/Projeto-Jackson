import { useState } from "react";
import { AthleteForm } from "@/components/AthleteForm";
import { TestForm } from "@/components/TestForm";
import { AthleteList } from "@/components/AthleteList";
import { TestResultCard } from "@/components/TestResultCard";
import { PerformanceChart } from "@/components/PerformanceChart";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Activity } from "lucide-react";

interface Athlete {
  id: string;
  name: string;
  age: string;
  sport: string;
}

interface Test {
  id: string;
  athleteId: string;
  athleteName: string;
  date: string;
  cmj: number;
  sj: number;
  observations: string;
}

export default function Dashboard() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [tests, setTests] = useState<Test[]>([]);

  const handleAddAthlete = (athleteData: { name: string; age: string; sport: string }) => {
    const newAthlete: Athlete = {
      id: Date.now().toString(),
      ...athleteData,
    };
    setAthletes([...athletes, newAthlete]);
    console.log('Athlete added:', newAthlete);
  };

  const handleAddTest = (testData: { athleteId: string; date: string; cmj: string; sj: string; observations: string }) => {
    const athlete = athletes.find(a => a.id === testData.athleteId);
    if (!athlete) return;

    const newTest: Test = {
      id: Date.now().toString(),
      athleteId: testData.athleteId,
      athleteName: athlete.name,
      date: testData.date,
      cmj: parseFloat(testData.cmj),
      sj: parseFloat(testData.sj),
      observations: testData.observations,
    };
    setTests([newTest, ...tests]);
    console.log('Test added:', newTest);
  };

  const getAthleteTests = (athleteId: string) => {
    return tests
      .filter(test => test.athleteId === athleteId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(test => ({
        date: test.date,
        cmj: test.cmj,
        sj: test.sj,
        difference: ((test.cmj - test.sj) / test.sj) * 100,
      }));
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">Sistema de Avaliação Física</h1>
              <p className="text-sm text-muted-foreground">Testes CMJ e SJ</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="tests" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="tests" data-testid="tab-tests">Testes</TabsTrigger>
            <TabsTrigger value="athletes" data-testid="tab-athletes">Atletas</TabsTrigger>
            <TabsTrigger value="analytics" data-testid="tab-analytics">Análises</TabsTrigger>
          </TabsList>

          <TabsContent value="tests" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TestForm athletes={athletes} onSubmit={handleAddTest} />
              
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Testes Recentes</h2>
                {tests.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground border rounded-lg">
                    <p>Nenhum teste registrado ainda</p>
                  </div>
                ) : (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto">
                    {tests.slice(0, 5).map((test) => (
                      <TestResultCard
                        key={test.id}
                        athleteName={test.athleteName}
                        date={test.date}
                        cmj={test.cmj}
                        sj={test.sj}
                        observations={test.observations}
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
              <AthleteList athletes={athletes} />
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {athletes.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground border rounded-lg">
                <p>Cadastre atletas e registre testes para visualizar análises</p>
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
