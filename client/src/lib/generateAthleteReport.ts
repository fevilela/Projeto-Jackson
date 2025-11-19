import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format } from "date-fns";

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
  margin: number
): number {
  if (yPosition > 250) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, margin, yPosition);
  yPosition += 8;

  return yPosition;
}

function addTextField(
  doc: jsPDF,
  label: string,
  value: string | undefined,
  yPosition: number,
  margin: number,
  pageWidth: number
): number {
  if (!value) return yPosition;

  if (yPosition > 270) {
    doc.addPage();
    yPosition = 20;
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  const labelLines = doc.splitTextToSize(`${label}:`, pageWidth - 2 * margin);
  doc.text(labelLines, margin, yPosition);
  yPosition += 5;

  doc.setFont("helvetica", "normal");
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
    const doc = new jsPDF();

    let yPosition = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text("RELATÓRIO COMPLETO DO ATLETA", pageWidth / 2, yPosition, {
      align: "center",
    });

    yPosition += 12;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm")}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );

    yPosition += 15;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("DADOS DO ATLETA", margin, yPosition);

    yPosition += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Nome: ${data.athlete.name}`, margin, yPosition);
    yPosition += 6;
    doc.text(`Idade: ${data.athlete.age} anos`, margin, yPosition);
    yPosition += 6;
    doc.text(`Esporte: ${data.athlete.sport}`, margin, yPosition);
    yPosition += 10;

    if (data.anamnesis && data.anamnesis.length > 0) {
      const sortedAnamnesis = [...data.anamnesis].sort(
        (a, b) =>
          new Date(b.anamnesisDate).getTime() -
          new Date(a.anamnesisDate).getTime()
      );
      const latestAnamnesis = sortedAnamnesis[0];

      yPosition = addSection(doc, "ANAMNESE", yPosition, margin);
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
        pageWidth
      );
      yPosition = addTextField(
        doc,
        "Nível de Atividade Atual",
        latestAnamnesis.currentActivityLevel,
        yPosition,
        margin,
        pageWidth
      );
      yPosition = addTextField(
        doc,
        "Histórico Médico",
        latestAnamnesis.medicalHistory,
        yPosition,
        margin,
        pageWidth
      );
      yPosition = addTextField(
        doc,
        "Lesões",
        latestAnamnesis.injuries,
        yPosition,
        margin,
        pageWidth
      );
      yPosition = addTextField(
        doc,
        "Medicamentos",
        latestAnamnesis.medications,
        yPosition,
        margin,
        pageWidth
      );
      yPosition = addTextField(
        doc,
        "Cirurgias",
        latestAnamnesis.surgeries,
        yPosition,
        margin,
        pageWidth
      );
      yPosition = addTextField(
        doc,
        "Alergias",
        latestAnamnesis.allergies,
        yPosition,
        margin,
        pageWidth
      );
      yPosition = addTextField(
        doc,
        "Histórico Familiar",
        latestAnamnesis.familyHistory,
        yPosition,
        margin,
        pageWidth
      );
      yPosition = addTextField(
        doc,
        "Estilo de Vida",
        latestAnamnesis.lifestyle,
        yPosition,
        margin,
        pageWidth
      );
      yPosition = addTextField(
        doc,
        "Qualidade do Sono",
        latestAnamnesis.sleepQuality,
        yPosition,
        margin,
        pageWidth
      );
      yPosition = addTextField(
        doc,
        "Nutrição",
        latestAnamnesis.nutrition,
        yPosition,
        margin,
        pageWidth
      );
      yPosition = addTextField(
        doc,
        "Esportes Anteriores",
        latestAnamnesis.previousSports,
        yPosition,
        margin,
        pageWidth
      );
      yPosition = addTextField(
        doc,
        "Observações Adicionais",
        latestAnamnesis.additionalNotes,
        yPosition,
        margin,
        pageWidth
      );
    }

    if (data.tests && data.tests.length > 0) {
      yPosition += 5;
      yPosition = addSection(
        doc,
        "RESULTADOS DE TESTES (CMJ E SJ)",
        yPosition,
        margin
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
      yPosition = addSection(doc, "AVALIAÇÕES FUNCIONAIS", yPosition, margin);

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
            pageWidth
          );
        }

        yPosition += 5;
      });
    }

    if (data.runningWorkouts && data.runningWorkouts.length > 0) {
      yPosition += 5;
      yPosition = addSection(doc, "TREINOS DE CORRIDA", yPosition, margin);

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
        margin
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
            pageWidth
          );
        }

        yPosition += 5;
      });
    }

    if (data.strengthExercises && data.strengthExercises.length > 0) {
      yPosition += 5;
      yPosition = addSection(doc, "EXERCÍCIOS DE FORÇA", yPosition, margin);

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
      yPosition = addSection(doc, "PERIODIZAÇÃO", yPosition, margin);

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
        pageWidth
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
