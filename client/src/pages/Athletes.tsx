import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AthleteForm } from "@/components/AthleteForm";
import { AthleteList } from "@/components/AthleteList";
import { useToast } from "@/hooks/use-toast";

interface Athlete {
  id: string;
  name: string;
  age: string;
  sport: string;
}

export default function Athletes() {
  const { toast } = useToast();

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
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

  const handleAddAthlete = (athleteData: {
    name: string;
    age: string;
    sport: string;
  }) => {
    createAthleteMutation.mutate(athleteData);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="title-athletes">
          Atletas
        </h1>
        <p className="text-muted-foreground">Gerencie seus atletas</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div data-testid="card-add-athlete">
          <AthleteForm onSubmit={handleAddAthlete} />
        </div>

        <div data-testid="card-athlete-list">
          <AthleteList athletes={athletes} />
        </div>
      </div>
    </div>
  );
}
