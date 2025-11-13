import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Trash2, Plus, Edit } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface Exercise {
  id: string;
  name: string;
  category: string;
  description: string | null;
  createdAt: string;
}

const exerciseFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  category: z.string().min(1, "Categoria é obrigatória"),
  description: z.string().optional(),
});

type ExerciseFormValues = z.infer<typeof exerciseFormSchema>;

export default function Exercises() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: exercises = [], isLoading } = useQuery<Exercise[]>({
    queryKey: ["/api/exercises"],
  });

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseFormSchema),
    defaultValues: {
      name: "",
      category: "",
      description: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ExerciseFormValues) => {
      const response = await apiRequest("POST", "/api/exercises", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
      toast({
        title: "Exercício cadastrado",
        description: "O exercício foi cadastrado com sucesso.",
      });
      form.reset();
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível cadastrar o exercício.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/exercises/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/exercises"] });
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold" data-testid="title-exercises">
            Cadastro de Exercícios
          </h1>
          <p className="text-muted-foreground">
            Gerencie o catálogo de exercícios
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-exercise">
              <Plus className="mr-2 h-4 w-4" />
              Novo Exercício
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Exercício</DialogTitle>
              <DialogDescription>
                Cadastre um novo exercício no sistema
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Exercício</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Agachamento, Supino..."
                          data-testid="input-exercise-name"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: Membros inferiores, Membros superiores..."
                          data-testid="input-exercise-category"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição (opcional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descrição do exercício, execução, observações..."
                          data-testid="input-exercise-description"
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
                      : "Cadastrar Exercício"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Exercícios Cadastrados</CardTitle>
          <CardDescription>
            Lista de todos os exercícios disponíveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando exercícios...
            </div>
          ) : exercises.length === 0 ? (
            <div
              className="text-center py-8 text-muted-foreground"
              data-testid="text-no-exercises"
            >
              Nenhum exercício cadastrado. Clique em "Novo Exercício" para
              começar.
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[80px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exercises.map((exercise) => (
                    <TableRow key={exercise.id} data-testid="row-exercise">
                      <TableCell className="font-medium">
                        {exercise.name}
                      </TableCell>
                      <TableCell>{exercise.category}</TableCell>
                      <TableCell className="max-w-md truncate">
                        {exercise.description || "-"}
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
    </div>
  );
}
