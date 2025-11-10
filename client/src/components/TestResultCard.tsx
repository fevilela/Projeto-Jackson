import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface TestResultCardProps {
  athleteName: string;
  date: string;
  cmj: number;
  sj: number;
  observations?: string;
}

export function TestResultCard({ athleteName, date, cmj, sj, observations }: TestResultCardProps) {
  const difference = (((cmj - sj) / sj) * 100).toFixed(1);
  const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR');

  return (
    <Card className="hover-elevate" data-testid={`card-test-result-${athleteName}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-semibold">{athleteName}</h3>
          <Badge variant="outline" className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formattedDate}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-muted-foreground">CMJ</div>
            <div className="text-2xl font-mono font-bold" data-testid="text-cmj">
              {cmj.toFixed(1)} cm
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-muted-foreground">SJ</div>
            <div className="text-2xl font-mono font-bold" data-testid="text-sj">
              {sj.toFixed(1)} cm
            </div>
          </div>
        </div>

        <div className="pt-2 border-t">
          <div className="text-sm font-medium text-muted-foreground">Diferença</div>
          <div 
            className={`text-xl font-mono font-bold ${parseFloat(difference) > 0 ? 'text-chart-2' : 'text-destructive'}`}
            data-testid="text-difference-percent"
          >
            {difference}%
          </div>
        </div>

        {observations && (
          <div className="pt-2 border-t">
            <div className="text-sm font-medium text-muted-foreground mb-1">Observações</div>
            <p className="text-sm" data-testid="text-observations">{observations}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
