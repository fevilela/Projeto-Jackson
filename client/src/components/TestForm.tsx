import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ClipboardCheck } from "lucide-react";

interface Athlete {
  id: string;
  name: string;
}

interface TestFormProps {
  athletes: Athlete[];
  onSubmit: (test: { athleteId: string; date: string; cmj: string; sj: string; observations: string }) => void;
}

export function TestForm({ athletes, onSubmit }: TestFormProps) {
  const [athleteId, setAthleteId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [cmj, setCmj] = useState("");
  const [sj, setSj] = useState("");
  const [observations, setObservations] = useState("");

  const difference = cmj && sj ? (((parseFloat(cmj) - parseFloat(sj)) / parseFloat(sj)) * 100).toFixed(1) : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (athleteId && date && cmj && sj) {
      onSubmit({ athleteId, date, cmj, sj, observations });
      setAthleteId("");
      setDate(new Date().toISOString().split('T')[0]);
      setCmj("");
      setSj("");
      setObservations("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardCheck className="h-5 w-5" />
          Registrar Teste CMJ e SJ
        </CardTitle>
        <CardDescription>Insira os resultados dos testes de salto</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="athlete">Atleta *</Label>
            <Select value={athleteId} onValueChange={setAthleteId} required>
              <SelectTrigger id="athlete" data-testid="select-athlete">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data do Teste *</Label>
            <Input
              id="date"
              data-testid="input-test-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cmj">Salto CMJ (cm) *</Label>
              <Input
                id="cmj"
                data-testid="input-cmj"
                type="number"
                step="0.1"
                placeholder="Ex: 45.5"
                value={cmj}
                onChange={(e) => setCmj(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sj">Salto SJ (cm) *</Label>
              <Input
                id="sj"
                data-testid="input-sj"
                type="number"
                step="0.1"
                placeholder="Ex: 42.3"
                value={sj}
                onChange={(e) => setSj(e.target.value)}
                required
              />
            </div>
          </div>

          {difference !== null && (
            <div className="p-4 bg-accent rounded-lg">
              <div className="text-sm font-medium text-muted-foreground">Diferença CMJ - SJ</div>
              <div className={`text-2xl font-mono font-bold ${parseFloat(difference) > 0 ? 'text-chart-2' : 'text-destructive'}`} data-testid="text-difference">
                {difference}%
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="observations">Observações</Label>
            <Textarea
              id="observations"
              data-testid="input-observations"
              placeholder="Adicione observações sobre o teste..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              className="min-h-24"
            />
          </div>

          <Button type="submit" className="w-full" data-testid="button-submit-test">
            Registrar Teste
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
