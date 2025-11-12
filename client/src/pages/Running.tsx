import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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

interface Athlete {
  id: string;
  name: string;
}

export default function Running() {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

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
            <CardTitle>Plano de Treinos</CardTitle>
            <CardDescription>Configure os treinos semanais</CardDescription>
          </CardHeader>
          <CardContent>
            <p
              className="text-muted-foreground text-center py-8"
              data-testid="text-coming-soon"
            >
              Funcionalidade em desenvolvimento
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
