import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { AthleteForm } from "@/components/AthleteForm";
import { AthleteList } from "@/components/AthleteList";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Athlete {
  id: string;
  name: string;
  age: string;
  sport: string;
}

export default function Athletes() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [newAthleteId, setNewAthleteId] = useState<string | null>(null);
  const [showAnamnesisDialog, setShowAnamnesisDialog] = useState(false);

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
    onSuccess: (newAthlete) => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
      toast({
        title: "Sucesso!",
        description: "Atleta cadastrado com sucesso.",
      });
      setNewAthleteId(newAthlete.id);
      setShowAnamnesisDialog(true);
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

  const handleGoToAnamnesis = () => {
    setShowAnamnesisDialog(false);
    if (newAthleteId) {
      setLocation(`/anamnese?athleteId=${newAthleteId}`);
    } else {
      setLocation("/anamnese");
    }
  };

  const handleSkipAnamnesis = () => {
    setShowAnamnesisDialog(false);
    setNewAthleteId(null);
  };

  return (
    <>
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

      <AlertDialog
        open={showAnamnesisDialog}
        onOpenChange={setShowAnamnesisDialog}
      >
        <AlertDialogContent data-testid="dialog-anamnesis-prompt">
          <AlertDialogHeader>
            <AlertDialogTitle>Fazer anamnese?</AlertDialogTitle>
            <AlertDialogDescription>
              Atleta cadastrado com sucesso! Deseja criar uma anamnese agora?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleSkipAnamnesis}
              data-testid="button-skip-anamnesis"
            >
              Agora não
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGoToAnamnesis}
              data-testid="button-go-to-anamnesis"
            >
              Sim, fazer anamnese
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
