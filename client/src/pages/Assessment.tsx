import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";

interface Athlete {
  id: string;
  name: string;
}

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

interface FunctionalAssessment {
  id: string;
  athleteId: string;
  movementTypeId: string | null;
  assessmentDate: string;
  ankMobility: string;
  hipMobility: string;
  thoracicMobility: string;
  coreStability: string;
  squatPattern: string;
  lungePattern: string;
  jumpPattern: string;
  runPattern: string;
  unilateralBalance: string;
  generalObservations: string;
  dynamicValues?: Array<{
    id: string;
    fieldId: string;
    value: string;
    fieldLabel: string;
    fieldName: string;
  }>;
}

const legacyAssessmentFields = [
  { key: "ankMobility", label: "Mobilidade de tornozelo" },
  { key: "hipMobility", label: "Mobilidade de quadril" },
  { key: "thoracicMobility", label: "Mobilidade torácica" },
  { key: "coreStability", label: "Estabilidade de core" },
  { key: "squatPattern", label: "Padrão de agachamento" },
  { key: "lungePattern", label: "Padrão de avanço" },
  { key: "jumpPattern", label: "Padrão de salto" },
  { key: "runPattern", label: "Padrão de corrida" },
  { key: "unilateralBalance", label: "Equilíbrio unilateral" },
];

export default function Assessment() {
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>("");
  const [selectedMovementTypeId, setSelectedMovementTypeId] =
    useState<string>("");
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [formData, setFormData] = useState<Record<string, string>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const { data: movementTypes = [] } = useQuery<MovementType[]>({
    queryKey: ["/api/movement-types"],
  });

  const { data: fields = [] } = useQuery<MovementField[]>({
    queryKey: [`/api/movement-types/${selectedMovementTypeId}/fields`],
    enabled: !!selectedMovementTypeId,
  });

  const { data: assessments = [] } = useQuery<FunctionalAssessment[]>({
    queryKey: [`/api/functional-assessments/athlete/${selectedAthleteId}`],
    enabled: !!selectedAthleteId,
  });

  useEffect(() => {
    if (selectedMovementTypeId) {
      const initialData: Record<string, string> = {};
      fields.forEach((field) => {
        initialData[field.fieldName] = "";
      });
      initialData.generalObservations = "";
      setFormData(initialData);
    }
  }, [selectedMovementTypeId, fields]);

  const createAssessment = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/functional-assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error("Erro ao salvar avaliação");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [`/api/functional-assessments/athlete/${selectedAthleteId}`],
      });
      toast({
        title: "Sucesso!",
        description: "Avaliação funcional salva com sucesso.",
      });
      const initialData: Record<string, string> = {};
      fields.forEach((field) => {
        initialData[field.fieldName] = "";
      });
      initialData.generalObservations = "";
      setFormData(initialData);
      setAssessmentDate(new Date().toISOString().split("T")[0]);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Erro",
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAthleteId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um atleta primeiro",
      });
      return;
    }

    if (!selectedMovementTypeId) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Selecione um tipo de movimento primeiro",
      });
      return;
    }

    const values = fields.map((field) => ({
      fieldId: field.id,
      value: formData[field.fieldName] || "",
    }));

    createAssessment.mutate({
      athleteId: selectedAthleteId,
      movementTypeId: selectedMovementTypeId,
      assessmentDate,
      generalObservations: formData.generalObservations || "",
      values,
    });
  };

  const handleInputChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold" data-testid="title-assessment">
          Avaliação Funcional
        </h1>
        <p className="text-muted-foreground">
          Avalie o movimento e mobilidade dos atletas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Selecionar Atleta</CardTitle>
            <CardDescription>
              Escolha um atleta para realizar avaliação funcional
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

        <Card>
          <CardHeader>
            <CardTitle>Tipo de Movimento</CardTitle>
            <CardDescription>
              Selecione o tipo de avaliação que deseja realizar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Select
              value={selectedMovementTypeId}
              onValueChange={setSelectedMovementTypeId}
            >
              <SelectTrigger data-testid="select-movement-type">
                <SelectValue placeholder="Selecione um tipo" />
              </SelectTrigger>
              <SelectContent>
                {movementTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      </div>

      {selectedAthleteId && selectedMovementTypeId && fields.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Nova Avaliação de Movimento</CardTitle>
              <CardDescription>
                Registre as avaliações de mobilidade e estabilidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="assessmentDate">Data da Avaliação</Label>
                  <Input
                    id="assessmentDate"
                    type="date"
                    value={assessmentDate}
                    onChange={(e) => setAssessmentDate(e.target.value)}
                    required
                  />
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[250px]">
                          Teste / Movimento
                        </TableHead>
                        <TableHead>Resultado / Observação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field) => (
                        <TableRow key={field.id}>
                          <TableCell className="font-medium">
                            {field.fieldLabel}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={formData[field.fieldName] || ""}
                              onChange={(e) =>
                                handleInputChange(
                                  field.fieldName,
                                  e.target.value
                                )
                              }
                              placeholder="Digite o resultado ou observação"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      <TableRow>
                        <TableCell className="font-medium">
                          Observações gerais
                        </TableCell>
                        <TableCell>
                          <Textarea
                            value={formData.generalObservations || ""}
                            onChange={(e) =>
                              handleInputChange(
                                "generalObservations",
                                e.target.value
                              )
                            }
                            placeholder="Digite observações gerais"
                            rows={3}
                          />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={createAssessment.isPending}
                >
                  {createAssessment.isPending
                    ? "Salvando..."
                    : "Salvar Avaliação"}
                </Button>
              </form>
            </CardContent>
          </Card>

          {selectedAthleteId && assessments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Avaliações</CardTitle>
                <CardDescription>
                  Avaliações anteriores deste atleta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessments.map((assessment) => {
                    const hasLegacyData = legacyAssessmentFields.some(
                      (field) =>
                        assessment[field.key as keyof FunctionalAssessment]
                    );
                    const hasDynamicValues =
                      assessment.dynamicValues &&
                      assessment.dynamicValues.length > 0;

                    return (
                      <div
                        key={assessment.id}
                        className="border rounded-lg p-4 space-y-2"
                      >
                        <div className="font-medium">
                          Data:{" "}
                          {new Date(
                            assessment.assessmentDate
                          ).toLocaleDateString("pt-BR")}
                        </div>
                        {hasDynamicValues ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {assessment.dynamicValues!.map((dynValue) => (
                              <div key={dynValue.id}>
                                <span className="font-medium">
                                  {dynValue.fieldLabel}:
                                </span>{" "}
                                {dynValue.value}
                              </div>
                            ))}
                            {assessment.generalObservations && (
                              <div className="md:col-span-2">
                                <span className="font-medium">
                                  Observações gerais:
                                </span>{" "}
                                {assessment.generalObservations}
                              </div>
                            )}
                          </div>
                        ) : hasLegacyData ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                            {legacyAssessmentFields.map((field) => {
                              const value =
                                assessment[
                                  field.key as keyof FunctionalAssessment
                                ];
                              if (typeof value === "string" && value) {
                                return (
                                  <div key={field.key}>
                                    <span className="font-medium">
                                      {field.label}:
                                    </span>{" "}
                                    {value}
                                  </div>
                                );
                              }
                              return null;
                            })}
                            {assessment.generalObservations && (
                              <div className="md:col-span-2">
                                <span className="font-medium">
                                  Observações gerais:
                                </span>{" "}
                                {assessment.generalObservations}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            Sem dados de avaliação
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
