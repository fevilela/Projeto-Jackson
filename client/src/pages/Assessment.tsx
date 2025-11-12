import { useState } from "react";
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

interface FunctionalAssessment {
  id: string;
  athleteId: string;
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
}

const assessmentFields = [
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
  const [assessmentDate, setAssessmentDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [formData, setFormData] = useState<Record<string, string>>({
    ankMobility: "",
    hipMobility: "",
    thoracicMobility: "",
    coreStability: "",
    squatPattern: "",
    lungePattern: "",
    jumpPattern: "",
    runPattern: "",
    unilateralBalance: "",
    generalObservations: "",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: athletes = [] } = useQuery<Athlete[]>({
    queryKey: ["/api/athletes"],
  });

  const { data: assessments = [] } = useQuery<FunctionalAssessment[]>({
    queryKey: [`/api/functional-assessments/athlete/${selectedAthleteId}`],
    enabled: !!selectedAthleteId,
  });

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
      setFormData({
        ankMobility: "",
        hipMobility: "",
        thoracicMobility: "",
        coreStability: "",
        squatPattern: "",
        lungePattern: "",
        jumpPattern: "",
        runPattern: "",
        unilateralBalance: "",
        generalObservations: "",
      });
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

    createAssessment.mutate({
      athleteId: selectedAthleteId,
      assessmentDate,
      ...formData,
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

      {selectedAthleteId && (
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
                      {assessmentFields.map((field) => (
                        <TableRow key={field.key}>
                          <TableCell className="font-medium">
                            {field.label}
                          </TableCell>
                          <TableCell>
                            <Input
                              value={formData[field.key]}
                              onChange={(e) =>
                                handleInputChange(field.key, e.target.value)
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
                            value={formData.generalObservations}
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

          {assessments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Avaliações</CardTitle>
                <CardDescription>
                  Avaliações anteriores deste atleta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assessments.map((assessment) => (
                    <div
                      key={assessment.id}
                      className="border rounded-lg p-4 space-y-2"
                    >
                      <div className="font-medium">
                        Data:{" "}
                        {new Date(assessment.assessmentDate).toLocaleDateString(
                          "pt-BR"
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                        {assessmentFields.map((field) => {
                          const value =
                            assessment[field.key as keyof FunctionalAssessment];
                          return value ? (
                            <div key={field.key}>
                              <span className="font-medium">
                                {field.label}:
                              </span>{" "}
                              {value}
                            </div>
                          ) : null;
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
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
