import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Eye } from "lucide-react";

interface Athlete {
  id: string;
  name: string;
  age: string;
  sport: string;
}

interface AthleteListProps {
  athletes: Athlete[];
  onSelectAthlete?: (athleteId: string) => void;
}

export function AthleteList({ athletes, onSelectAthlete }: AthleteListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Atletas Cadastrados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {athletes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum atleta cadastrado ainda</p>
          </div>
        ) : (
          <div className="space-y-2">
            {athletes.map((athlete) => (
              <div
                key={athlete.id}
                className="flex items-center justify-between p-4 rounded-lg border hover-elevate"
                data-testid={`athlete-item-${athlete.id}`}
              >
                <div className="flex-1">
                  <h4 className="font-semibold">{athlete.name}</h4>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {athlete.age} anos
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {athlete.sport}
                    </Badge>
                  </div>
                </div>
                {onSelectAthlete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onSelectAthlete(athlete.id)}
                    data-testid={`button-view-athlete-${athlete.id}`}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    Ver
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
