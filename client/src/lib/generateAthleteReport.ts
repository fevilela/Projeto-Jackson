import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

const COLORS = {
  primary: [210, 235, 56] as [number, number, number],
  dark: [18, 18, 18] as [number, number, number],
  mediumDark: [25, 25, 25] as [number, number, number],
  gray: [46, 46, 46] as [number, number, number],
  lightGray: [179, 179, 179] as [number, number, number],
  white: [250, 250, 250] as [number, number, number],
};

async function loadLogoAsBase64(): Promise<string> {
  try {
    const response = await fetch("/images/logo-jackson-max.jpg");
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error("Error loading logo:", error);
    return "";
  }
}

function addPageDecoration(doc: jsPDF, pageNumber: number) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(14, 10, pageWidth - 14, 10);

  doc.setDrawColor(...COLORS.gray);
  doc.setLineWidth(0.3);
  doc.line(14, pageHeight - 10, pageWidth - 14, pageHeight - 10);

  doc.setFillColor(...COLORS.primary);
  doc.rect(14, 8, 3, 4, "F");
  doc.rect(pageWidth - 17, 8, 3, 4, "F");

  doc.setFontSize(8);
  doc.setTextColor(...COLORS.lightGray);
  doc.setFont("helvetica", "normal");
  doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 6, {
    align: "center",
  });
}

interface AthleteReportData {
  athlete: {
    id: string;
    name: string;
    age: number;
    sport: string;
  };
  tests: Array<{
    id: string;
    testDate: string;
    cmj: string;
    sj: string;
    observations?: string;
  }>;
  anamnesis: Array<{
    anamnesisDate: string;
    mainGoal?: string;
    medicalHistory?: string;
    injuries?: string;
    medications?: string;
    surgeries?: string;
    allergies?: string;
    familyHistory?: string;
    lifestyle?: string;
    sleepQuality?: string;
    nutrition?: string;
    currentActivityLevel?: string;
    previousSports?: string;
    additionalNotes?: string;
  }>;
  runningWorkouts: Array<{
    weekNumber: number;
    dayName: string;
    training: string;
    distance?: string;
    observations?: string;
    startDate?: string;
  }>;
  runningPlans: Array<{
    startDate?: string;
    vo1?: string;
    vo2?: string;
    vo2lt?: string;
    vo2Dmax?: string;
    tfExplanation?: string;
  }>;
  periodizationPlans: Array<{
    period: string;
    mainFocus: string;
    weeklyStructure?: string;
    volumeIntensity?: string;
    observations?: string;
  }>;
  periodizationNote?: {
    generalObservations?: string;
  };
  strengthExercises: Array<{
    block: string;
    exercise: string;
    sets: string;
    reps: string;
    observations?: string;
  }>;
  functionalAssessments: Array<{
    assessmentDate: string;
    ankMobility?: string;
    hipMobility?: string;
    thoracicMobility?: string;
    coreStability?: string;
    squatPattern?: string;
    lungePattern?: string;
    jumpPattern?: string;
    runPattern?: string;
    unilateralBalance?: string;
    generalObservations?: string;
  }>;
}

function addSection(
  doc: jsPDF,
  title: string,
  yPosition: number,
  margin: number,
  pageNumber: { current: number }
): number {
  if (yPosition > 250) {
    doc.addPage();
    pageNumber.current++;
    addPageDecoration(doc, pageNumber.current);
    yPosition = 20;
  }

  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPosition - 3, 4, 6, "F");

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(title, margin + 7, yPosition);

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.5);
  doc.line(margin + 7, yPosition + 2, pageWidth - margin, yPosition + 2);

  yPosition += 10;

  return yPosition;
}

function addTextField(
  doc: jsPDF,
  label: string,
  value: string | undefined,
  yPosition: number,
  margin: number,
  pageWidth: number,
  pageNumber: { current: number }
): number {
  if (!value) return yPosition;

  if (yPosition > 270) {
    doc.addPage();
    pageNumber.current++;
    addPageDecoration(doc, pageNumber.current);
    yPosition = 20;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  const labelLines = doc.splitTextToSize(`${label}:`, pageWidth - 2 * margin);
  doc.text(labelLines, margin, yPosition);
  yPosition += 5;

  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.gray);
  const valueLines = doc.splitTextToSize(value, pageWidth - 2 * margin);
  doc.text(valueLines, margin, yPosition);
  yPosition += valueLines.length * 5 + 3;

  return yPosition;
}

export async function generateAthleteReport(athleteId: string) {
  try {
    const response = await fetch(`/api/athletes/${athleteId}/report`);
    if (!response.ok) {
      throw new Error("Erro ao buscar dados do atleta");
    }

    const data: AthleteReportData = await response.json();
    const logoBase64 = await loadLogoAsBase64();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const pageNumber = { current: 1 };

    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, pageWidth, 45, "F");

    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(0.8);
    doc.line(margin, 10, pageWidth - margin, 10);

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "JPEG", (pageWidth - 100) / 2, 14, 100, 25);
      } catch (error) {
        console.error("Error adding logo to PDF:", error);
      }
    }

    let yPosition = 54;
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text("RELATÓRIO COMPLETO DO ATLETA", pageWidth / 2, yPosition, {
      align: "center",
    });

    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );

    yPosition += 10;
    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(1.5);
    doc.rect(margin, yPosition, pageWidth - 2 * margin, 22, "S");

    yPosition += 9;
    doc.setFontSize(15);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text(`${data.athlete.name}`, pageWidth / 2, yPosition, {
      align: "center",
    });

    yPosition += 7;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.text(
      `${data.athlete.age} anos | ${data.athlete.sport}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );

    yPosition += 15;
    addPageDecoration(doc, pageNumber.current);

    if (data.anamnesis && data.anamnesis.length > 0) {
      const sortedAnamnesis = [...data.anamnesis].sort(
        (a, b) =>
          new Date(b.anamnesisDate).getTime() -
          new Date(a.anamnesisDate).getTime()
      );
      const latestAnamnesis = sortedAnamnesis[0];

      yPosition = addSection(doc, "ANAMNESE", yPosition, margin, pageNumber);
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.text(
        `Data: ${format(
          new Date(latestAnamnesis.anamnesisDate),
          "dd/MM/yyyy"
        )}`,
        margin,
        yPosition
      );
      yPosition += 8;

      yPosition = addTextField(
        doc,
        "Objetivo Principal",
        latestAnamnesis.mainGoal,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
      yPosition = addTextField(
        doc,
        "Nível de Atividade Atual",
        latestAnamnesis.currentActivityLevel,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
      yPosition = addTextField(
        doc,
        "Histórico Médico",
        latestAnamnesis.medicalHistory,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
      yPosition = addTextField(
        doc,
        "Lesões",
        latestAnamnesis.injuries,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
      yPosition = addTextField(
        doc,
        "Medicamentos",
        latestAnamnesis.medications,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
      yPosition = addTextField(
        doc,
        "Cirurgias",
        latestAnamnesis.surgeries,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
      yPosition = addTextField(
        doc,
        "Alergias",
        latestAnamnesis.allergies,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
      yPosition = addTextField(
        doc,
        "Histórico Familiar",
        latestAnamnesis.familyHistory,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
      yPosition = addTextField(
        doc,
        "Estilo de Vida",
        latestAnamnesis.lifestyle,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
      yPosition = addTextField(
        doc,
        "Qualidade do Sono",
        latestAnamnesis.sleepQuality,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
      yPosition = addTextField(
        doc,
        "Nutrição",
        latestAnamnesis.nutrition,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
      yPosition = addTextField(
        doc,
        "Esportes Anteriores",
        latestAnamnesis.previousSports,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
      yPosition = addTextField(
        doc,
        "Observações Adicionais",
        latestAnamnesis.additionalNotes,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
    }

    if (data.tests && data.tests.length > 0) {
      yPosition += 5;
      yPosition = addSection(
        doc,
        "RESULTADOS DE TESTES (CMJ E SJ)",
        yPosition,
        margin,
        pageNumber
      );

      const testsData = data.tests
        .sort(
          (a, b) =>
            new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
        )
        .map((test) => [
          format(new Date(test.testDate), "dd/MM/yyyy"),
          `${test.cmj} cm`,
          `${test.sj} cm`,
          test.observations || "-",
        ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Data", "CMJ", "SJ", "Observações"]],
        body: testsData,
        theme: "grid",
        headStyles: { fillColor: [66, 66, 66], fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          3: { cellWidth: 60 },
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;

      if (data.tests.length > 1) {
        const sortedTests = [...data.tests].sort(
          (a, b) =>
            new Date(a.testDate).getTime() - new Date(b.testDate).getTime()
        );
        const firstTest = sortedTests[0];
        const lastTest = sortedTests[sortedTests.length - 1];

        const firstCmj = parseFloat(firstTest.cmj);
        const lastCmj = parseFloat(lastTest.cmj);
        const firstSj = parseFloat(firstTest.sj);
        const lastSj = parseFloat(lastTest.sj);

        const cmjImprovement =
          firstCmj > 0 && !isNaN(firstCmj) && !isNaN(lastCmj)
            ? (((lastCmj - firstCmj) / firstCmj) * 100).toFixed(1)
            : "N/A";
        const sjImprovement =
          firstSj > 0 && !isNaN(firstSj) && !isNaN(lastSj)
            ? (((lastSj - firstSj) / firstSj) * 100).toFixed(1)
            : "N/A";

        if (yPosition > 250) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("EVOLUÇÃO DE PERFORMANCE", margin, yPosition);
        yPosition += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        const cmjText =
          cmjImprovement !== "N/A"
            ? `CMJ: ${firstTest.cmj} cm → ${lastTest.cmj} cm (${cmjImprovement}%)`
            : `CMJ: ${firstTest.cmj} cm → ${lastTest.cmj} cm`;
        const sjText =
          sjImprovement !== "N/A"
            ? `SJ: ${firstTest.sj} cm → ${lastTest.sj} cm (${sjImprovement}%)`
            : `SJ: ${firstTest.sj} cm → ${lastTest.sj} cm`;
        doc.text(cmjText, margin, yPosition);
        yPosition += 6;
        doc.text(sjText, margin, yPosition);
        yPosition += 6;
      }
    }

    if (data.functionalAssessments && data.functionalAssessments.length > 0) {
      yPosition += 5;
      yPosition = addSection(
        doc,
        "AVALIAÇÕES FUNCIONAIS",
        yPosition,
        margin,
        pageNumber
      );

      const sortedAssessments = [...data.functionalAssessments].sort(
        (a, b) =>
          new Date(b.assessmentDate).getTime() -
          new Date(a.assessmentDate).getTime()
      );

      sortedAssessments.forEach((assessment, index) => {
        if (index > 0 && yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(
          `Avaliação de ${format(
            new Date(assessment.assessmentDate),
            "dd/MM/yyyy"
          )}`,
          margin,
          yPosition
        );
        yPosition += 7;

        const assessmentData: string[][] = [];
        if (assessment.ankMobility)
          assessmentData.push([
            "Mobilidade de Tornozelo",
            assessment.ankMobility,
          ]);
        if (assessment.hipMobility)
          assessmentData.push([
            "Mobilidade de Quadril",
            assessment.hipMobility,
          ]);
        if (assessment.thoracicMobility)
          assessmentData.push([
            "Mobilidade Torácica",
            assessment.thoracicMobility,
          ]);
        if (assessment.coreStability)
          assessmentData.push([
            "Estabilidade do Core",
            assessment.coreStability,
          ]);
        if (assessment.squatPattern)
          assessmentData.push([
            "Padrão de Agachamento",
            assessment.squatPattern,
          ]);
        if (assessment.lungePattern)
          assessmentData.push(["Padrão de Afundo", assessment.lungePattern]);
        if (assessment.jumpPattern)
          assessmentData.push(["Padrão de Salto", assessment.jumpPattern]);
        if (assessment.runPattern)
          assessmentData.push(["Padrão de Corrida", assessment.runPattern]);
        if (assessment.unilateralBalance)
          assessmentData.push([
            "Equilíbrio Unilateral",
            assessment.unilateralBalance,
          ]);

        if (assessmentData.length > 0) {
          autoTable(doc, {
            startY: yPosition,
            body: assessmentData,
            theme: "striped",
            bodyStyles: { fontSize: 9 },
            columnStyles: {
              0: { fontStyle: "bold", cellWidth: 60 },
            },
            margin: { left: margin, right: margin },
          });
          yPosition = (doc as any).lastAutoTable.finalY + 5;
        }

        if (assessment.generalObservations) {
          yPosition = addTextField(
            doc,
            "Observações Gerais",
            assessment.generalObservations,
            yPosition,
            margin,
            pageWidth,
            pageNumber
          );
        }

        yPosition += 5;
      });
    }

    if (data.runningWorkouts && data.runningWorkouts.length > 0) {
      yPosition += 5;
      yPosition = addSection(
        doc,
        "TREINOS DE CORRIDA",
        yPosition,
        margin,
        pageNumber
      );

      const workoutsData = data.runningWorkouts.map((workout) => [
        `Semana ${workout.weekNumber}`,
        workout.dayName,
        workout.startDate
          ? format(new Date(workout.startDate), "dd/MM/yyyy")
          : "-",
        workout.training,
        workout.distance || "-",
        workout.observations || "-",
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Semana", "Dia", "Data Início", "Treino", "Dist.", "Obs."]],
        body: workoutsData,
        theme: "grid",
        headStyles: { fillColor: [66, 66, 66], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 7 },
        columnStyles: {
          3: { cellWidth: 40 },
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    if (data.runningPlans && data.runningPlans.length > 0) {
      yPosition += 5;
      yPosition = addSection(
        doc,
        "PLANOS DE CORRIDA (CALCULADORA VO2)",
        yPosition,
        margin,
        pageNumber
      );

      data.runningPlans.forEach((plan, index) => {
        if (yPosition > 240) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text(
          `Plano ${index + 1}${
            plan.startDate
              ? ` - ${format(new Date(plan.startDate), "dd/MM/yyyy")}`
              : ""
          }`,
          margin,
          yPosition
        );
        yPosition += 7;

        const planData: string[][] = [];
        if (plan.vo1) planData.push(["VO1", plan.vo1]);
        if (plan.vo2) planData.push(["VO2", plan.vo2]);
        if (plan.vo2lt) planData.push(["VO2 Limiar", plan.vo2lt]);
        if (plan.vo2Dmax) planData.push(["VO2 Dmax", plan.vo2Dmax]);

        if (planData.length > 0) {
          autoTable(doc, {
            startY: yPosition,
            body: planData,
            theme: "striped",
            bodyStyles: { fontSize: 9 },
            columnStyles: {
              0: { fontStyle: "bold", cellWidth: 40 },
            },
            margin: { left: margin, right: margin },
          });
          yPosition = (doc as any).lastAutoTable.finalY + 5;
        }

        if (plan.tfExplanation) {
          yPosition = addTextField(
            doc,
            "Explicação TF",
            plan.tfExplanation,
            yPosition,
            margin,
            pageWidth,
            pageNumber
          );
        }

        yPosition += 5;
      });
    }

    if (data.strengthExercises && data.strengthExercises.length > 0) {
      yPosition += 5;
      yPosition = addSection(
        doc,
        "EXERCÍCIOS DE FORÇA",
        yPosition,
        margin,
        pageNumber
      );

      const exercisesData = data.strengthExercises.map((exercise) => [
        exercise.block,
        exercise.exercise,
        exercise.sets,
        exercise.reps,
        exercise.observations || "-",
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Bloco", "Exercício", "Séries", "Reps", "Obs."]],
        body: exercisesData,
        theme: "grid",
        headStyles: { fillColor: [66, 66, 66], fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          1: { cellWidth: 60 },
          4: { cellWidth: 40 },
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    if (data.periodizationPlans && data.periodizationPlans.length > 0) {
      yPosition += 5;
      yPosition = addSection(
        doc,
        "PERIODIZAÇÃO",
        yPosition,
        margin,
        pageNumber
      );

      const periodsData = data.periodizationPlans.map((plan) => [
        plan.period,
        plan.mainFocus,
        plan.weeklyStructure || "-",
        plan.volumeIntensity || "-",
        plan.observations || "-",
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [["Período", "Foco", "Estrutura", "Vol/Int", "Obs."]],
        body: periodsData,
        theme: "grid",
        headStyles: { fillColor: [66, 66, 66], fontSize: 9, fontStyle: "bold" },
        bodyStyles: { fontSize: 8 },
        columnStyles: {
          1: { cellWidth: 40 },
          4: { cellWidth: 40 },
        },
        margin: { left: margin, right: margin },
      });

      yPosition = (doc as any).lastAutoTable.finalY + 10;
    }

    if (data.periodizationNote?.generalObservations) {
      yPosition += 5;
      yPosition = addTextField(
        doc,
        "Observações Gerais da Periodização",
        data.periodizationNote.generalObservations,
        yPosition,
        margin,
        pageWidth,
        pageNumber
      );
    }

    const fileName = `relatorio_completo_${data.athlete.name
      .toLowerCase()
      .replace(/\s+/g, "_")}_${format(new Date(), "yyyyMMdd")}.pdf`;
    doc.save(fileName);

    return true;
  } catch (error) {
    console.error("Erro ao gerar relatório:", error);
    throw error;
  }
}
