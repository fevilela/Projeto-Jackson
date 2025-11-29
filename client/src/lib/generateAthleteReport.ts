import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

const COLORS = {
  primary: [210, 235, 56] as [number, number, number],
  dark: [18, 18, 18] as [number, number, number],
  mediumDark: [25, 25, 25] as [number, number, number],
  gray: [46, 46, 46] as [number, number, number],
  lightGray: [120, 120, 120] as [number, number, number],
  white: [250, 250, 250] as [number, number, number],
  accent: [180, 180, 180] as [number, number, number],
};

const SPACING = {
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
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
  doc.setLineWidth(0.8);
  doc.line(20, 12, pageWidth - 20, 12);

  doc.setDrawColor(...COLORS.accent);
  doc.setLineWidth(0.2);
  doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);

  doc.setFillColor(...COLORS.primary);
  doc.rect(20, 10, 4, 4, "F");
  doc.rect(pageWidth - 24, 10, 4, 4, "F");

  doc.setFontSize(9);
  doc.setTextColor(...COLORS.lightGray);
  doc.setFont("times", "italic");
  doc.text(`Página ${pageNumber}`, pageWidth / 2, pageHeight - 10, {
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
  if (yPosition > 240) {
    doc.addPage();
    pageNumber.current++;
    addPageDecoration(doc, pageNumber.current);
    yPosition = 25;
  }

  doc.setFillColor(...COLORS.primary);
  doc.rect(margin, yPosition - 4, 5, 8, "F");

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  doc.text(title.toUpperCase(), margin + 9, yPosition);

  const pageWidth = doc.internal.pageSize.getWidth();
  doc.setDrawColor(...COLORS.primary);
  doc.setLineWidth(0.6);
  doc.line(margin + 9, yPosition + 2, pageWidth - margin, yPosition + 2);

  yPosition += SPACING.large;

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

  if (yPosition > 260) {
    doc.addPage();
    pageNumber.current++;
    addPageDecoration(doc, pageNumber.current);
    yPosition = 25;
  }

  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.dark);
  const labelLines = doc.splitTextToSize(`${label}:`, pageWidth - 2 * margin);
  doc.text(labelLines, margin, yPosition);
  yPosition += SPACING.medium;

  doc.setFont("times", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...COLORS.gray);
  const valueLines = doc.splitTextToSize(value, pageWidth - 2 * margin);
  doc.text(valueLines, margin, yPosition);
  yPosition += valueLines.length * 6 + SPACING.medium;

  return yPosition;
}

export async function generateAthleteReport(athleteId: string) {
  try {
    // Determine which endpoint to use
    const url =
      athleteId === "self"
        ? "/api/athlete/report"
        : `/api/athletes/${athleteId}/report`;
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) {
      throw new Error("Erro ao buscar dados do atleta");
    }

    const data: AthleteReportData = await response.json();
    const logoBase64 = await loadLogoAsBase64();

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const pageNumber = { current: 1 };

    doc.setFillColor(...COLORS.dark);
    doc.rect(0, 0, pageWidth, 48, "F");

    doc.setDrawColor(...COLORS.primary);
    doc.setLineWidth(1);
    doc.line(margin, 12, pageWidth - margin, 12);

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "JPEG", (pageWidth - 90) / 2, 16, 90, 23);
      } catch (error) {
        console.error("Error adding logo to PDF:", error);
      }
    }

    let yPosition = 58;
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text("RELATÓRIO COMPLETO DO ATLETA", pageWidth / 2, yPosition, {
      align: "center",
    });

    yPosition += SPACING.medium;
    doc.setFontSize(9);
    doc.setFont("times", "italic");
    doc.setTextColor(...COLORS.lightGray);
    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );

    yPosition += SPACING.large;
    doc.setDrawColor(...COLORS.primary);
    doc.setFillColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.roundedRect(margin, yPosition, pageWidth - 2 * margin, 26, 2, 2, "S");

    yPosition += SPACING.medium + 2;
    doc.setFontSize(17);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.dark);
    doc.text(`${data.athlete.name}`, pageWidth / 2, yPosition, {
      align: "center",
    });

    yPosition += SPACING.medium;
    doc.setFontSize(11);
    doc.setFont("times", "normal");
    doc.setTextColor(...COLORS.gray);
    doc.text(
      `${data.athlete.age} anos  •  ${data.athlete.sport}`,
      pageWidth / 2,
      yPosition,
      {
        align: "center",
      }
    );

    yPosition += SPACING.xlarge + 2;
    addPageDecoration(doc, pageNumber.current);

    if (data.anamnesis && data.anamnesis.length > 0) {
      const sortedAnamnesis = [...data.anamnesis].sort(
        (a, b) =>
          new Date(b.anamnesisDate).getTime() -
          new Date(a.anamnesisDate).getTime()
      );
      const latestAnamnesis = sortedAnamnesis[0];

      yPosition = addSection(doc, "Anamnese", yPosition, margin, pageNumber);
      doc.setFontSize(10);
      doc.setFont("times", "italic");
      doc.setTextColor(...COLORS.lightGray);
      doc.text(
        `Data da avaliação: ${format(
          new Date(latestAnamnesis.anamnesisDate),
          "dd/MM/yyyy"
        )}`,
        margin,
        yPosition
      );
      yPosition += SPACING.medium + 2;

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
      yPosition += SPACING.medium;
      yPosition = addSection(
        doc,
        "Resultados de Testes (CMJ e SJ)",
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
        head: [["Data", "CMJ (cm)", "SJ (cm)", "Observações"]],
        body: testsData,
        theme: "striped",
        headStyles: {
          fillColor: [46, 46, 46],
          fontSize: 10,
          fontStyle: "bold",
          font: "helvetica",
          textColor: [255, 255, 255],
          halign: "center",
        },
        bodyStyles: {
          fontSize: 12,
          font: "times",
          cellPadding: 4,
        },
        columnStyles: {
          0: { halign: "center", font: "times" },
          1: {
            font: "courier",
            fontStyle: "bold",
            halign: "center",
            textColor: [46, 46, 46],
          },
          2: {
            font: "courier",
            fontStyle: "bold",
            halign: "center",
            textColor: [46, 46, 46],
          },
          3: { cellWidth: 65 },
        },
        margin: { left: margin, right: margin },
        alternateRowStyles: { fillColor: [248, 248, 248] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + SPACING.large;

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

        if (yPosition > 240) {
          doc.addPage();
          pageNumber.current++;
          addPageDecoration(doc, pageNumber.current);
          yPosition = 25;
        }

        doc.setFillColor(245, 245, 245);
        doc.rect(margin, yPosition - 2, pageWidth - 2 * margin, 28, "F");

        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.dark);
        doc.text("Evolução de Performance", margin + 3, yPosition + 4);
        yPosition += SPACING.large;

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.gray);
        doc.text("CMJ:", margin + 3, yPosition);
        doc.setFont("courier", "bold");
        doc.setTextColor(...COLORS.dark);
        const cmjText =
          cmjImprovement !== "N/A"
            ? `${firstTest.cmj} cm → ${lastTest.cmj} cm (${
                parseFloat(cmjImprovement) >= 0 ? "+" : ""
              }${cmjImprovement}%)`
            : `${firstTest.cmj} cm → ${lastTest.cmj} cm`;
        doc.text(cmjText, margin + 20, yPosition);
        yPosition += SPACING.medium;

        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.gray);
        doc.text("SJ:", margin + 3, yPosition);
        doc.setFont("courier", "bold");
        doc.setTextColor(...COLORS.dark);
        const sjText =
          sjImprovement !== "N/A"
            ? `${firstTest.sj} cm → ${lastTest.sj} cm (${
                parseFloat(sjImprovement) >= 0 ? "+" : ""
              }${sjImprovement}%)`
            : `${firstTest.sj} cm → ${lastTest.sj} cm`;
        doc.text(sjText, margin + 20, yPosition);
        yPosition += SPACING.medium;
      }
    }

    if (data.functionalAssessments && data.functionalAssessments.length > 0) {
      yPosition += SPACING.medium;
      yPosition = addSection(
        doc,
        "Avaliações Funcionais",
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
        if (index > 0 && yPosition > 220) {
          doc.addPage();
          pageNumber.current++;
          addPageDecoration(doc, pageNumber.current);
          yPosition = 25;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.dark);
        doc.text(
          `Avaliação de ${format(
            new Date(assessment.assessmentDate),
            "dd/MM/yyyy"
          )}`,
          margin,
          yPosition
        );
        yPosition += SPACING.medium;

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
            bodyStyles: {
              fontSize: 12,
              font: "times",
              cellPadding: 3,
            },
            columnStyles: {
              0: { fontStyle: "bold", cellWidth: 70, font: "helvetica" },
              1: { font: "times" },
            },
            margin: { left: margin, right: margin },
            alternateRowStyles: { fillColor: [248, 248, 248] },
          });
          yPosition = (doc as any).lastAutoTable.finalY + SPACING.medium;
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
      yPosition += SPACING.medium;
      yPosition = addSection(
        doc,
        "Treinos de Corrida",
        yPosition,
        margin,
        pageNumber
      );

      const sortedWorkouts = [...data.runningWorkouts].sort(
        (a, b) => a.weekNumber - b.weekNumber
      );

      const weekGroups: { [key: number]: typeof sortedWorkouts } = {};
      sortedWorkouts.forEach((workout) => {
        if (!weekGroups[workout.weekNumber]) {
          weekGroups[workout.weekNumber] = [];
        }
        weekGroups[workout.weekNumber].push(workout);
      });

      const workoutsData: any[][] = [];
      Object.keys(weekGroups)
        .map(Number)
        .sort((a, b) => a - b)
        .forEach((weekNum) => {
          const weekWorkouts = weekGroups[weekNum];
          weekWorkouts.forEach((workout, idx) => {
            const row = [
              idx === 0
                ? { content: `Semana ${weekNum}`, rowSpan: weekWorkouts.length }
                : null,
              workout.dayName,
              workout.startDate
                ? format(new Date(workout.startDate), "dd/MM/yyyy")
                : "-",
              workout.training,
              workout.distance || "-",
              workout.observations || "-",
            ].filter((cell) => cell !== null);
            workoutsData.push(row);
          });
        });

      autoTable(doc, {
        startY: yPosition,
        head: [["Semana", "Dia", "Data Início", "Treino", "Dist.", "Obs."]],
        body: workoutsData,
        theme: "striped",
        headStyles: {
          fillColor: [46, 46, 46],
          fontSize: 9,
          fontStyle: "bold",
          font: "helvetica",
          textColor: [255, 255, 255],
          halign: "center",
        },
        bodyStyles: {
          fontSize: 11,
          font: "times",
          cellPadding: 3,
        },
        columnStyles: {
          0: {
            halign: "center",
            font: "helvetica",
            fontStyle: "bold",
            valign: "middle",
          },
          1: { halign: "center" },
          2: { halign: "center" },
          3: { cellWidth: 45 },
        },
        margin: { left: margin, right: margin },
        alternateRowStyles: { fillColor: [248, 248, 248] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + SPACING.large;
    }

    if (data.runningPlans && data.runningPlans.length > 0) {
      yPosition += SPACING.medium;
      yPosition = addSection(
        doc,
        "Planos de Corrida (Calculadora VO2)",
        yPosition,
        margin,
        pageNumber
      );

      data.runningPlans.forEach((plan, index) => {
        if (yPosition > 230) {
          doc.addPage();
          pageNumber.current++;
          addPageDecoration(doc, pageNumber.current);
          yPosition = 25;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...COLORS.dark);
        doc.text(
          `Plano ${index + 1}${
            plan.startDate
              ? ` - ${format(new Date(plan.startDate), "dd/MM/yyyy")}`
              : ""
          }`,
          margin,
          yPosition
        );
        yPosition += SPACING.medium;

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
            bodyStyles: {
              fontSize: 12,
              font: "times",
              cellPadding: 3,
            },
            columnStyles: {
              0: { fontStyle: "bold", cellWidth: 50, font: "helvetica" },
              1: { font: "courier", fontStyle: "bold", halign: "center" },
            },
            margin: { left: margin, right: margin },
            alternateRowStyles: { fillColor: [248, 248, 248] },
          });
          yPosition = (doc as any).lastAutoTable.finalY + SPACING.medium;
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
      yPosition += SPACING.medium;
      yPosition = addSection(
        doc,
        "Exercícios de Força",
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
        theme: "striped",
        headStyles: {
          fillColor: [46, 46, 46],
          fontSize: 10,
          fontStyle: "bold",
          font: "helvetica",
          textColor: [255, 255, 255],
          halign: "center",
        },
        bodyStyles: {
          fontSize: 12,
          font: "times",
          cellPadding: 3,
        },
        columnStyles: {
          0: { halign: "center", font: "helvetica", fontStyle: "bold" },
          1: { cellWidth: 65 },
          2: { halign: "center", font: "courier", fontStyle: "bold" },
          3: { halign: "center", font: "courier", fontStyle: "bold" },
          4: { cellWidth: 45 },
        },
        margin: { left: margin, right: margin },
        alternateRowStyles: { fillColor: [248, 248, 248] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + SPACING.large;
    }

    if (data.periodizationPlans && data.periodizationPlans.length > 0) {
      yPosition += SPACING.medium;
      yPosition = addSection(
        doc,
        "Periodização",
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
        head: [
          ["Período", "Foco Principal", "Estrutura Semanal", "Vol/Int", "Obs."],
        ],
        body: periodsData,
        theme: "striped",
        headStyles: {
          fillColor: [46, 46, 46],
          fontSize: 9,
          fontStyle: "bold",
          font: "helvetica",
          textColor: [255, 255, 255],
          halign: "center",
        },
        bodyStyles: {
          fontSize: 12,
          font: "times",
          cellPadding: 3,
        },
        columnStyles: {
          0: { halign: "center", font: "helvetica", fontStyle: "bold" },
          1: { cellWidth: 50 },
          4: { cellWidth: 45 },
        },
        margin: { left: margin, right: margin },
        alternateRowStyles: { fillColor: [248, 248, 248] },
      });

      yPosition = (doc as any).lastAutoTable.finalY + SPACING.large;
    }

    if (data.periodizationNote?.generalObservations) {
      yPosition += SPACING.medium;
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
