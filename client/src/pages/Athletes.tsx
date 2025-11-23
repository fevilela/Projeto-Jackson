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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save, Search, UserPlus } from "lucide-react";

interface Athlete {
  id: string;
  name: string;
  age: string;
  sport: string;
  phone?: string;
  email?: string;
}

export default function Athletes() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [newAthleteId, setNewAthleteId] = useState<string | null>(null);
  const [showAnamnesisDialog, setShowAnamnesisDialog] = useState(false);
  const [editingAthlete, setEditingAthlete] = useState<Athlete | null>(null);
  const [showNewAthleteDialog, setShowNewAthleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [editForm, setEditForm] = useState({
    name: "",
    age: "",
    sport: "",
    phone: "",
    email: "",
  });
  const [newAthleteForm, setNewAthleteForm] = useState({
    name: "",
    age: "",
    sport: "",
    phone: "",
    email: "",
  });

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const createAthleteMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      age: string;
      sport: string;
      phone?: string;
      email?: string;
    }) => {
      const response = await apiRequest("POST", "/api/athletes", {
        name: data.name,
        age: parseInt(data.age),
        sport: data.sport,
        phone: data.phone,
        email: data.email,
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

  const updateAthleteMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      name: string;
      age: string;
      sport: string;
      phone?: string;
      email?: string;
    }) => {
      const response = await apiRequest("PATCH", `/api/athletes/${data.id}`, {
        name: data.name,
        age: parseInt(data.age),
        sport: data.sport,
        phone: data.phone,
        email: data.email,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/athletes"] });
      toast({
        title: "Sucesso!",
        description: "Atleta atualizado com sucesso.",
      });
      setEditingAthlete(null);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao atualizar atleta",
      });
    },
  });

  const handleAddAthlete = (athleteData: {
    name: string;
    age: string;
    sport: string;
    phone?: string;
    email?: string;
  }) => {
    createAthleteMutation.mutate(athleteData);
  };

  const handleCreateNewAthlete = () => {
    if (newAthleteForm.name && newAthleteForm.age && newAthleteForm.sport) {
      createAthleteMutation.mutate(newAthleteForm);
      setNewAthleteForm({ name: "", age: "", sport: "", phone: "", email: "" });
      setShowNewAthleteDialog(false);
    }
  };

  const filteredAthletes = athletes.filter(
    (athlete) =>
      athlete.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      athlete.sport.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEditAthlete = (athlete: Athlete) => {
    setEditingAthlete(athlete);
    setEditForm({
      name: athlete.name,
      age: athlete.age.toString(),
      sport: athlete.sport,
      phone: athlete.phone || "",
      email: athlete.email || "",
    });
  };

  const handleSaveEdit = () => {
    if (editingAthlete && editForm.name && editForm.age && editForm.sport) {
      updateAthleteMutation.mutate({
        id: editingAthlete.id,
        ...editForm,
      });
    }
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

        <div className="flex gap-4 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Pesquisar por nome ou modalidade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search-athletes"
            />
          </div>
          <Button
            onClick={() => setShowNewAthleteDialog(true)}
            data-testid="button-new-athlete"
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Novo Atleta
          </Button>
        </div>

        <div data-testid="card-athlete-list">
          <AthleteList
            athletes={filteredAthletes}
            onEditAthlete={handleEditAthlete}
          />
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

      <Dialog
        open={showNewAthleteDialog}
        onOpenChange={setShowNewAthleteDialog}
      >
        <DialogContent data-testid="dialog-new-athlete">
          <DialogHeader>
            <DialogTitle>Novo Atleta</DialogTitle>
            <DialogDescription>
              Cadastre um novo atleta no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-name">Nome do Atleta *</Label>
              <Input
                id="new-name"
                value={newAthleteForm.name}
                onChange={(e) =>
                  setNewAthleteForm({ ...newAthleteForm, name: e.target.value })
                }
                placeholder="Digite o nome completo"
                data-testid="input-new-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-age">Idade *</Label>
                <Input
                  id="new-age"
                  type="number"
                  value={newAthleteForm.age}
                  onChange={(e) =>
                    setNewAthleteForm({
                      ...newAthleteForm,
                      age: e.target.value,
                    })
                  }
                  placeholder="Ex: 25"
                  data-testid="input-new-age"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-sport">Modalidade *</Label>
                <Input
                  id="new-sport"
                  value={newAthleteForm.sport}
                  onChange={(e) =>
                    setNewAthleteForm({
                      ...newAthleteForm,
                      sport: e.target.value,
                    })
                  }
                  placeholder="Ex: Futebol"
                  data-testid="input-new-sport"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="new-phone">Telefone</Label>
                <Input
                  id="new-phone"
                  type="tel"
                  value={newAthleteForm.phone}
                  onChange={(e) =>
                    setNewAthleteForm({
                      ...newAthleteForm,
                      phone: e.target.value,
                    })
                  }
                  placeholder="(00) 00000-0000"
                  data-testid="input-new-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-email">Email</Label>
                <Input
                  id="new-email"
                  type="email"
                  value={newAthleteForm.email}
                  onChange={(e) =>
                    setNewAthleteForm({
                      ...newAthleteForm,
                      email: e.target.value,
                    })
                  }
                  placeholder="atleta@email.com"
                  data-testid="input-new-email"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewAthleteDialog(false);
                  setNewAthleteForm({
                    name: "",
                    age: "",
                    sport: "",
                    phone: "",
                    email: "",
                  });
                }}
                data-testid="button-cancel-new"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleCreateNewAthlete}
                disabled={
                  createAthleteMutation.isPending ||
                  !newAthleteForm.name ||
                  !newAthleteForm.age ||
                  !newAthleteForm.sport
                }
                data-testid="button-save-new"
              >
                <Save className="mr-2 h-4 w-4" />
                {createAthleteMutation.isPending
                  ? "Cadastrando..."
                  : "Cadastrar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editingAthlete}
        onOpenChange={(open) => !open && setEditingAthlete(null)}
      >
        <DialogContent data-testid="dialog-edit-athlete">
          <DialogHeader>
            <DialogTitle>Editar Atleta</DialogTitle>
            <DialogDescription>
              Atualize as informações do atleta
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome do Atleta *</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) =>
                  setEditForm({ ...editForm, name: e.target.value })
                }
                placeholder="Digite o nome completo"
                data-testid="input-edit-name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-age">Idade *</Label>
                <Input
                  id="edit-age"
                  type="number"
                  value={editForm.age}
                  onChange={(e) =>
                    setEditForm({ ...editForm, age: e.target.value })
                  }
                  placeholder="Ex: 25"
                  data-testid="input-edit-age"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sport">Modalidade *</Label>
                <Input
                  id="edit-sport"
                  value={editForm.sport}
                  onChange={(e) =>
                    setEditForm({ ...editForm, sport: e.target.value })
                  }
                  placeholder="Ex: Futebol"
                  data-testid="input-edit-sport"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone: e.target.value })
                  }
                  placeholder="(00) 00000-0000"
                  data-testid="input-edit-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                  placeholder="atleta@email.com"
                  data-testid="input-edit-email"
                />
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => setEditingAthlete(null)}
                data-testid="button-cancel-edit"
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSaveEdit}
                disabled={
                  updateAthleteMutation.isPending ||
                  !editForm.name ||
                  !editForm.age ||
                  !editForm.sport
                }
                data-testid="button-save-edit"
              >
                <Save className="mr-2 h-4 w-4" />
                {updateAthleteMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
