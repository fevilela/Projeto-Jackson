import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus, Edit } from "lucide-react";
import { useLocation } from "wouter";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Athlete {
  id: string;
  name: string;
}

interface Anamnesis {
  id: string;
  athleteId: string;
  userId: string;
  anamnesisDate: string;
  mainGoal: string | null;
  medicalHistory: string | null;
  injuries: string | null;
  medications: string | null;
  surgeries: string | null;
  allergies: string | null;
  familyHistory: string | null;
  lifestyle: string | null;
  sleepQuality: string | null;
  nutrition: string | null;
  currentActivityLevel: string | null;
  previousSports: string | null;
  additionalNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

const anamnesisFormSchema = z.object({
  anamnesisDate: z.string().min(1, "Data é obrigatória"),
  mainGoal: z.string().optional(),
  medicalHistory: z.string().optional(),
  injuries: z.string().optional(),
  medications: z.string().optional(),
  surgeries: z.string().optional(),
  allergies: z.string().optional(),
  familyHistory: z.string().optional(),
  lifestyle: z.string().optional(),
  sleepQuality: z.string().optional(),
  nutrition: z.string().optional(),
  currentActivityLevel: z.string().optional(),
  previousSports: z.string().optional(),
  additionalNotes: z.string().optional(),
});

type AnamnesisFormValues = z.infer<typeof anamnesisFormSchema>;

export default function Anamnese() {
  const [location] = useLocation();
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAnamnesis, setEditingAnamnesis] = useState<Anamnesis | null>(
    null
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  useEffect(() => {
    const params = new URLSearchParams(location.split("?")[1] || "");
    const athleteId = params.get("athleteId");
    if (athleteId && athletes.some((a) => a.id === athleteId)) {
      setSelectedAthleteId(athleteId);
    }
  }, [location, athletes]);

  const { data: anamnesisData = [], isLoading: anamnesisLoading } = useQuery<
    Anamnesis[]
  >({
    queryKey: ["/api/anamnesis/athlete", selectedAthleteId],
    enabled: !!selectedAthleteId,
  });

  const form = useForm<AnamnesisFormValues>({
    resolver: zodResolver(anamnesisFormSchema),
    defaultValues: {
      anamnesisDate: new Date().toISOString().split("T")[0],
      mainGoal: "",
      medicalHistory: "",
      injuries: "",
      medications: "",
      surgeries: "",
      allergies: "",
      familyHistory: "",
      lifestyle: "",
      sleepQuality: "",
      nutrition: "",
      currentActivityLevel: "",
      previousSports: "",
      additionalNotes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: AnamnesisFormValues) => {
      if (!selectedAthleteId) {
        throw new Error("Nenhum atleta selecionado");
      }
      const response = await apiRequest("POST", "/api/anamnesis", {
        ...data,
        athleteId: selectedAthleteId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/anamnesis/athlete", selectedAthleteId],
      });
      toast({
        title: "Anamnese criada",
        description: "A anamnese foi criada com sucesso.",
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar a anamnese.",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: AnamnesisFormValues) => {
      if (!editingAnamnesis) {
        throw new Error("Nenhuma anamnese selecionada para edição");
      }
      const response = await apiRequest(
        "PATCH",
        `/api/anamnesis/${editingAnamnesis.id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/anamnesis/athlete", selectedAthleteId],
      });
      toast({
        title: "Anamnese atualizada",
        description: "A anamnese foi atualizada com sucesso.",
      });
      form.reset();
      setEditingAnamnesis(null);
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar a anamnese.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/anamnesis/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/anamnesis/athlete", selectedAthleteId],
      });
      toast({
        title: "Anamnese excluída",
        description: "A anamnese foi excluída com sucesso.",
      });
      setDeletingId(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir a anamnese.",
        variant: "destructive",
      });
      setDeletingId(null);
    },
  });

  const onSubmit = (data: AnamnesisFormValues) => {
    if (editingAnamnesis) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = () => {
    if (deletingId) {
      deleteMutation.mutate(deletingId);
    }
  };

  const handleEdit = (anamnesis: Anamnesis) => {
    setEditingAnamnesis(anamnesis);
    form.reset({
      anamnesisDate: anamnesis.anamnesisDate,
      mainGoal: anamnesis.mainGoal || "",
      medicalHistory: anamnesis.medicalHistory || "",
      injuries: anamnesis.injuries || "",
      medications: anamnesis.medications || "",
      surgeries: anamnesis.surgeries || "",
      allergies: anamnesis.allergies || "",
      familyHistory: anamnesis.familyHistory || "",
      lifestyle: anamnesis.lifestyle || "",
      sleepQuality: anamnesis.sleepQuality || "",
      nutrition: anamnesis.nutrition || "",
      currentActivityLevel: anamnesis.currentActivityLevel || "",
      previousSports: anamnesis.previousSports || "",
      additionalNotes: anamnesis.additionalNotes || "",
    });
    setIsDialogOpen(true);
  };

  const handleNewAnamnesis = () => {
    setEditingAnamnesis(null);
    form.reset({
      anamnesisDate: new Date().toISOString().split("T")[0],
      mainGoal: "",
      medicalHistory: "",
      injuries: "",
      medications: "",
      surgeries: "",
      allergies: "",
      familyHistory: "",
      lifestyle: "",
      sleepQuality: "",
      nutrition: "",
      currentActivityLevel: "",
      previousSports: "",
      additionalNotes: "",
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="title-anamnese">
          Anamnese
        </h1>
        <p className="text-muted-foreground">
          Gerencie as anamneses dos atletas
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Atleta</CardTitle>
          <CardDescription>
            Escolha um atleta para gerenciar as anamneses
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
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Anamneses</CardTitle>
              <CardDescription>
                Histórico de anamneses do atleta
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  onClick={handleNewAnamnesis}
                  data-testid="button-add-anamnesis"
                  disabled={!selectedAthleteId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Anamnese
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingAnamnesis ? "Editar" : "Nova"} Anamnese
                  </DialogTitle>
                  <DialogDescription>
                    {editingAnamnesis
                      ? "Atualize as informações da anamnese"
                      : "Preencha as informações da anamnese"}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="anamnesisDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data da Anamnese</FormLabel>
                          <FormControl>
                            <Input
                              type="date"
                              data-testid="input-anamnesis-date"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="mainGoal"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Objetivo Principal</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ex: Perder peso, ganhar massa muscular..."
                                data-testid="input-main-goal"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currentActivityLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nível de Atividade Atual</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Sedentário, moderado, ativo..."
                                data-testid="input-activity-level"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="medicalHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Histórico Médico</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Doenças, condições médicas..."
                              data-testid="input-medical-history"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="injuries"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Lesões</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Lesões anteriores ou atuais..."
                                data-testid="input-injuries"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="surgeries"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cirurgias</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Cirurgias realizadas..."
                                data-testid="input-surgeries"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="medications"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Medicamentos</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Medicamentos em uso..."
                                data-testid="input-medications"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="allergies"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Alergias</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Alergias conhecidas..."
                                data-testid="input-allergies"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="familyHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Histórico Familiar</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Doenças na família..."
                              data-testid="input-family-history"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="lifestyle"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Estilo de Vida</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Rotina diária, trabalho..."
                                data-testid="input-lifestyle"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sleepQuality"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qualidade do Sono</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Horas de sono, qualidade..."
                                data-testid="input-sleep-quality"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="nutrition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nutrição</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Hábitos alimentares..."
                                data-testid="input-nutrition"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="previousSports"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Esportes Praticados</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Esportes praticados anteriormente..."
                              data-testid="input-previous-sports"
                              rows={3}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações Adicionais</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Outras informações relevantes..."
                              data-testid="input-additional-notes"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsDialogOpen(false);
                          setEditingAnamnesis(null);
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          createMutation.isPending || updateMutation.isPending
                        }
                        data-testid="button-submit-anamnesis"
                      >
                        {createMutation.isPending || updateMutation.isPending
                          ? "Salvando..."
                          : editingAnamnesis
                          ? "Atualizar Anamnese"
                          : "Salvar Anamnese"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {anamnesisLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando anamneses...
              </div>
            ) : anamnesisData.length === 0 ? (
              <div
                className="text-center py-8 text-muted-foreground"
                data-testid="text-no-anamnesis"
              >
                Nenhuma anamnese cadastrada. Clique em "Nova Anamnese" para
                começar.
              </div>
            ) : (
              <div className="space-y-4">
                {anamnesisData.map((anamnesis) => (
                  <Card
                    key={anamnesis.id}
                    data-testid={`card-anamnesis-${anamnesis.id}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>
                            Anamnese -{" "}
                            {new Date(
                              anamnesis.anamnesisDate
                            ).toLocaleDateString("pt-BR")}
                          </CardTitle>
                          <CardDescription>
                            Criada em{" "}
                            {new Date(anamnesis.createdAt).toLocaleDateString(
                              "pt-BR"
                            )}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(anamnesis)}
                            data-testid={`button-edit-anamnesis-${anamnesis.id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeletingId(anamnesis.id)}
                            data-testid={`button-delete-anamnesis-${anamnesis.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {anamnesis.mainGoal && (
                        <div>
                          <strong>Objetivo:</strong> {anamnesis.mainGoal}
                        </div>
                      )}
                      {anamnesis.currentActivityLevel && (
                        <div>
                          <strong>Nível de Atividade:</strong>{" "}
                          {anamnesis.currentActivityLevel}
                        </div>
                      )}
                      {anamnesis.medicalHistory && (
                        <div>
                          <strong>Histórico Médico:</strong>{" "}
                          {anamnesis.medicalHistory}
                        </div>
                      )}
                      {anamnesis.injuries && (
                        <div>
                          <strong>Lesões:</strong> {anamnesis.injuries}
                        </div>
                      )}
                      {anamnesis.medications && (
                        <div>
                          <strong>Medicamentos:</strong> {anamnesis.medications}
                        </div>
                      )}
                      {anamnesis.allergies && (
                        <div>
                          <strong>Alergias:</strong> {anamnesis.allergies}
                        </div>
                      )}
                      {anamnesis.additionalNotes && (
                        <div>
                          <strong>Observações:</strong>{" "}
                          {anamnesis.additionalNotes}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta anamnese? Esta ação não pode
              ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              data-testid="button-confirm-delete"
            >
              {deleteMutation.isPending ? "Excluindo..." : "Excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
