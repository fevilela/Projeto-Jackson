import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus } from "lucide-react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface StrengthExercise {
  id: string;
  athleteId: string;
  userId: string;
  block: string;
  exercise: string;
  sets: string;
  reps: string;
  observations: string | null;
  createdAt: string;
}

const exerciseFormSchema = z.object({
  block: z.string().min(1, "Bloco é obrigatório"),
  exercise: z.string().min(1, "Exercício é obrigatório"),
  sets: z.string().min(1, "Séries é obrigatório"),
  reps: z.string().min(1, "Repetições/Tempo é obrigatório"),
  observations: z.string().optional(),
});

type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

export default function Strength() {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api", "athletes"],
  });

  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<
    StrengthExercise[]
  >({
    queryKey: ["/api/strength-exercises/athlete", selectedAthleteId],
    enabled: !!selectedAthleteId,
  });

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      block: "",
      exercise: "",
      sets: "",
      reps: "",
      observations: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ExerciseFormValues) => {
      const response = await apiRequest("POST", "/api/strength-exercises", {
        ...data,
        athleteId: selectedAthleteId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/strength-exercises/athlete", selectedAthleteId],
      });
      toast({
        title: "Exercício adicionado",
        description: "O exercício foi adicionado com sucesso.",
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar o exercício.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/strength-exercises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/strength-exercises/athlete", selectedAthleteId],
      });
      toast({
        title: "Exercício excluído",
        description: "O exercício foi excluído com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível excluir o exercício.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ExerciseFormValues) => {
    createMutation.mutate(data);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este exercício?")) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="title-strength">
          Preparação do Movimento / Força Funcional
        </h1>
        <p className="text-muted-foreground">
          Gerencie exercícios de força funcional e preparação de movimento
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Atleta</CardTitle>
          <CardDescription>
            Escolha um atleta para gerenciar os exercícios
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
              <CardTitle>Exercícios de Força</CardTitle>
              <CardDescription>
                Configure os exercícios e cargas
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  data-testid="button-add-exercise"
                  disabled={!selectedAthleteId}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Adicionar Exercício
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Novo Exercício</DialogTitle>
                  <DialogDescription>
                    Adicione um novo exercício de força funcional
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="block"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bloco</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: A, B, C..."
                              data-testid="input-block"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="exercise"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Exercício</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Agachamento livre"
                              data-testid="input-exercise"
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
                        name="sets"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Séries</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 3x"
                                data-testid="input-sets"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="reps"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Repetições / Tempo</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Ex: 10 reps ou 30s"
                                data-testid="input-reps"
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
                      name="observations"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações / Foco</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Observações sobre o exercício..."
                              data-testid="input-observations"
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
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="submit"
                        disabled={createMutation.isPending}
                        data-testid="button-submit-exercise"
                      >
                        {createMutation.isPending
                          ? "Salvando..."
                          : "Salvar Exercício"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {exercisesLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Carregando exercícios...
              </div>
            ) : exercises.length === 0 ? (
              <div
                className="text-center py-8 text-muted-foreground"
                data-testid="text-no-exercises"
              >
                Nenhum exercício cadastrado. Clique em "Adicionar Exercício"
                para começar.
              </div>
            ) : (
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-bold">Bloco</TableHead>
                      <TableHead className="font-bold">Exercício</TableHead>
                      <TableHead className="font-bold">Séries</TableHead>
                      <TableHead className="font-bold">
                        Repetições / Tempo
                      </TableHead>
                      <TableHead className="font-bold">
                        Observações / Foco
                      </TableHead>
                      <TableHead className="w-[80px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {exercises.map((exercise) => (
                      <TableRow key={exercise.id} data-testid="row-exercise">
                        <TableCell className="font-medium">
                          {exercise.block}
                        </TableCell>
                        <TableCell>{exercise.exercise}</TableCell>
                        <TableCell>{exercise.sets}</TableCell>
                        <TableCell>{exercise.reps}</TableCell>
                        <TableCell className="max-w-xs truncate">
                          {exercise.observations || "-"}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(exercise.id)}
                            data-testid="button-delete-exercise"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
