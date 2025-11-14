import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, Trash2, Settings } from "lucide-react";

interface MovementType {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  createdAt: string;
}

interface MovementField {
  id: string;
  movementTypeId: string;
  fieldName: string;
  fieldLabel: string;
  fieldOrder: number;
  createdAt: string;
}

export default function MovementTypes() {
  const { toast } = useToast();
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeDescription, setNewTypeDescription] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState<string>("");
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: movementTypes = [] } = useQuery<MovementType[]>({
    queryKey: ["/api/movement-types"],
  });

  const { data: fields = [] } = useQuery<MovementField[]>({
    queryKey: [`/api/movement-types/${selectedTypeId}/fields`],
    enabled: !!selectedTypeId,
  });

  const createTypeMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const response = await apiRequest("POST", "/api/movement-types", data);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movement-types"] });
      toast({
        title: "Sucesso!",
        description: "Tipo de movimento criado com sucesso.",
      });
      setNewTypeName("");
      setNewTypeDescription("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao criar tipo de movimento",
      });
    },
  });

  const deleteTypeMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await apiRequest("DELETE", `/api/movement-types/${id}`);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/movement-types"] });
      toast({
        title: "Sucesso!",
        description: "Tipo de movimento excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao excluir tipo de movimento",
      });
    },
  });

  const createFieldMutation = useMutation({
    mutationFn: async (data: {
      typeId: string;
      fieldLabel: string;
      fieldOrder: number;
    }) => {
      const fieldName = data.fieldLabel.toLowerCase().replace(/\s+/g, "_");
      const response = await apiRequest(
        "POST",
        `/api/movement-types/${data.typeId}/fields`,
        {
          fieldName,
          fieldLabel: data.fieldLabel,
          fieldOrder: data.fieldOrder,
        }
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/movement-types/${selectedTypeId}/fields`],
      });
      toast({
        title: "Sucesso!",
        description: "Campo adicionado com sucesso.",
      });
      setNewFieldLabel("");
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao adicionar campo",
      });
    },
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (data: { typeId: string; fieldId: string }) => {
      const response = await apiRequest(
        "DELETE",
        `/api/movement-types/${data.typeId}/fields/${data.fieldId}`
      );
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/movement-types/${selectedTypeId}/fields`],
      });
      toast({
        title: "Sucesso!",
        description: "Campo excluído com sucesso.",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message || "Erro ao excluir campo",
      });
    },
  });

  const handleCreateType = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTypeName.trim()) {
      createTypeMutation.mutate({
        name: newTypeName,
        description: newTypeDescription,
      });
    }
  };

  const handleAddField = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFieldLabel.trim() && selectedTypeId) {
      createFieldMutation.mutate({
        typeId: selectedTypeId,
        fieldLabel: newFieldLabel,
        fieldOrder: fields.length,
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tipos de Movimento</h1>
        <p className="text-muted-foreground">
          Crie e gerencie tipos de movimento personalizados para suas avaliações
        </p>
      </div>

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Meus Tipos</TabsTrigger>
          <TabsTrigger value="create">Criar Novo Tipo</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <Card>
            <CardHeader>
              <CardTitle>Criar Tipo de Movimento</CardTitle>
              <CardDescription>
                Defina um novo tipo de movimento para suas avaliações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateType} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Tipo *</Label>
                  <Input
                    id="name"
                    placeholder="Ex: Avaliação de Mobilidade"
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    placeholder="Descreva quando usar este tipo de movimento..."
                    value={newTypeDescription}
                    onChange={(e) => setNewTypeDescription(e.target.value)}
                    className="min-h-24"
                  />
                </div>

                <Button type="submit" className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Criar Tipo de Movimento
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <div className="grid gap-6">
            {movementTypes.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Nenhum tipo de movimento cadastrado ainda. Crie o primeiro!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="w-[200px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {movementTypes.map((type) => (
                    <TableRow key={type.id}>
                      <TableCell className="font-medium">{type.name}</TableCell>
                      <TableCell>{type.description || "-"}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Dialog
                            open={isDialogOpen && selectedTypeId === type.id}
                            onOpenChange={(open) => {
                              setIsDialogOpen(open);
                              if (open) {
                                setSelectedTypeId(type.id);
                              }
                            }}
                          >
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSelectedTypeId(type.id)}
                              >
                                <Settings className="h-4 w-4 mr-1" />
                                Configurar Campos
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>Campos de {type.name}</DialogTitle>
                                <DialogDescription>
                                  Adicione ou remova campos para este tipo de
                                  movimento
                                </DialogDescription>
                              </DialogHeader>

                              <div className="space-y-4">
                                <form
                                  onSubmit={handleAddField}
                                  className="flex gap-2"
                                >
                                  <Input
                                    placeholder="Nome do campo"
                                    value={newFieldLabel}
                                    onChange={(e) =>
                                      setNewFieldLabel(e.target.value)
                                    }
                                  />
                                  <Button type="submit">
                                    <Plus className="h-4 w-4" />
                                  </Button>
                                </form>

                                {fields.length === 0 ? (
                                  <p className="text-center text-sm text-muted-foreground py-4">
                                    Nenhum campo adicionado ainda
                                  </p>
                                ) : (
                                  <div className="space-y-2">
                                    {fields.map((field) => (
                                      <div
                                        key={field.id}
                                        className="flex items-center justify-between p-2 border rounded"
                                      >
                                        <span>{field.fieldLabel}</span>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() =>
                                            deleteFieldMutation.mutate({
                                              typeId: type.id,
                                              fieldId: field.id,
                                            })
                                          }
                                        >
                                          <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteTypeMutation.mutate(type.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
