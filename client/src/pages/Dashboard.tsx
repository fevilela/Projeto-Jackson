import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Users,
  ClipboardList,
  TrendingUp,
  Calendar,
  Dumbbell,
  Activity,
} from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

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
  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const { data: tests = [] } = useQuery<Test[]>({
    queryKey: ["/api/tests"],
  });

  const recentTests = tests.slice(-5).reverse();
  const totalAthletes = athletes.length;
  const totalTests = tests.length;

  const features = [
    {
      title: "Atletas",
      description: "Gerencie seu plantel de atletas",
      icon: Users,
      link: "/athletes",
      count: totalAthletes,
    },
    {
      title: "Testes",
      description: "Registre e acompanhe testes de desempenho",
      icon: ClipboardList,
      link: "/tests",
      count: totalTests,
    },
    {
      title: "Avaliação",
      description: "Análises detalhadas de performance",
      icon: TrendingUp,
      link: "/assessment",
      count: null,
    },
    {
      title: "Periodização",
      description: "Planeje treinos e competições",
      icon: Calendar,
      link: "/periodization",
      count: null,
    },
    {
      title: "Força",
      description: "Treinos de força e potência",
      icon: Dumbbell,
      link: "/strength",
      count: null,
    },
    {
      title: "Corrida",
      description: "Treinos e análises de corrida",
      icon: Activity,
      link: "/running",
      count: null,
    },
  ];

  return (
    <div className="space-y-8 p-6">
      <div className="flex flex-col space-y-6">
        <div className="w-full">
          <img
            src="/images/logo-jackson-max.jpg"
            alt="Jackson Max Treinador"
            className="w-full h-auto object-cover"
            data-testid="img-logo"
          />
        </div>

        <div className="space-y-2 text-center">
          <h1
            className="text-4xl font-bold tracking-tight"
            data-testid="text-title"
          >
            Sistema de Avaliação Física
          </h1>
          <p className="text-xl text-muted-foreground">
            Plataforma completa para gestão de atletas e análise de desempenho
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Link key={feature.title} href={feature.link}>
              <Card
                className="cursor-pointer transition-all hover-elevate"
                data-testid={`card-feature-${feature.title.toLowerCase()}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Icon className="h-8 w-8 text-primary" />
                    {feature.count !== null && (
                      <span className="text-2xl font-bold text-primary">
                        {feature.count}
                      </span>
                    )}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>

      {recentTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Testes Recentes</CardTitle>
            <CardDescription>
              Últimos {recentTests.length} testes realizados
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between border-b pb-4 last:border-0"
                >
                  <div>
                    <p className="font-medium">{test.athleteName}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(test.testDate).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">
                      <span className="font-medium">CMJ:</span> {test.cmj}cm
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">SJ:</span> {test.sj}cm
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link href="/tests">
                <Button variant="outline" className="w-full">
                  Ver Todos os Testes
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {totalAthletes === 0 && (
        <Card className="border-primary">
          <CardHeader>
            <CardTitle>Bem-vindo!</CardTitle>
            <CardDescription>
              Comece cadastrando seus primeiros atletas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/athletes">
              <Button className="w-full">
                <Users className="mr-2 h-4 w-4" />
                Cadastrar Atletas
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
