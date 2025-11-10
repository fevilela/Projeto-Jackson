import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

interface AthleteFormProps {
  onSubmit: (athlete: { name: string; age: string; sport: string }) => void;
}

export function AthleteForm({ onSubmit }: AthleteFormProps) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [sport, setSport] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && age && sport) {
      onSubmit({ name, age, sport });
      setName("");
      setAge("");
      setSport("");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Cadastrar Atleta
        </CardTitle>
        <CardDescription>Adicione um novo atleta ao sistema</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Atleta *</Label>
            <Input
              id="name"
              data-testid="input-athlete-name"
              placeholder="Digite o nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Idade *</Label>
              <Input
                id="age"
                data-testid="input-athlete-age"
                type="number"
                placeholder="Ex: 25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sport">Modalidade *</Label>
              <Input
                id="sport"
                data-testid="input-athlete-sport"
                placeholder="Ex: Futebol"
                value={sport}
                onChange={(e) => setSport(e.target.value)}
                required
              />
            </div>
          </div>

          <Button type="submit" className="w-full" data-testid="button-submit-athlete">
            Cadastrar Atleta
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
