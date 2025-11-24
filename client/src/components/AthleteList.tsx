import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Users, Eye, FileDown, Phone, Mail, Edit } from "lucide-react";
import { generateAthleteReport } from "@/lib/generateAthleteReport";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface Athlete {
  id: string;
  name: string;
  age: string;
  sport: string;
  phone?: string;
  email?: string;
}

interface AthleteListProps {
  athletes: Athlete[];
  onSelectAthlete?: (athleteId: string) => void;
  onEditAthlete?: (athlete: Athlete) => void;
}

export function AthleteList({
  athletes,
  onSelectAthlete,
  onEditAthlete,
}: AthleteListProps) {
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownloadReport = async (
    athleteId: string,
    athleteName: string
  ) => {
    try {
      setDownloadingId(athleteId);
      await generateAthleteReport(athleteId);
      toast({
        title: "Sucesso!",
        description: `Relatório de ${athleteName} baixado com sucesso.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao gerar relatório. Tente novamente.",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Atletas Cadastrados
        </CardTitle>
      </CardHeader>
      <CardContent>
        {athletes.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum atleta cadastrado ainda</p>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Idade</TableHead>
                  <TableHead>Modalidade</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {athletes.map((athlete) => (
                  <TableRow
                    key={athlete.id}
                    data-testid={`athlete-item-${athlete.id}`}
                  >
                    <TableCell className="font-medium">
                      {athlete.name}
                    </TableCell>
                    <TableCell>{athlete.age} anos</TableCell>
                    <TableCell>
                      <Badge variant="outline">{athlete.sport}</Badge>
                    </TableCell>
                    <TableCell>
                      {athlete.phone ? (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {athlete.phone}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {athlete.email ? (
                        <span className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {athlete.email}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        {onEditAthlete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onEditAthlete(athlete)}
                            data-testid={`button-edit-athlete-${athlete.id}`}
                            title="Editar atleta"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            handleDownloadReport(athlete.id, athlete.name)
                          }
                          disabled={downloadingId === athlete.id}
                          data-testid={`button-download-report-${athlete.id}`}
                          title="Baixar relatório completo em PDF"
                        >
                          <FileDown className="h-4 w-4 mr-1" />
                          {downloadingId === athlete.id ? "Gerando..." : "PDF"}
                        </Button>
                        {onSelectAthlete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onSelectAthlete(athlete.id)}
                            data-testid={`button-view-athlete-${athlete.id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Ver
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
