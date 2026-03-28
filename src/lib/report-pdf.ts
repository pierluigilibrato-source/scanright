import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type { RmLombosacraleInput } from "@/lib/schema";
import type { AppropriatenessResult } from "@/lib/rm-lombosacrale-rules";

function yesNoToText(value: "si" | "no"): string {
  return value === "si" ? "Si" : "No";
}

function splitLinesByWidth(params: {
  text: string;
  maxWidth: number;
  size: number;
  widthOfTextAtSize: (text: string, size: number) => number;
}): string[] {
  const { text, maxWidth, size, widthOfTextAtSize } = params;
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }

  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

export async function buildRmReportPdf(params: {
  data: RmLombosacraleInput;
  result: AppropriatenessResult;
}) {
  const neurologicalDeficitLabel: Record<RmLombosacraleInput["neurologicalDeficit"], string> =
    {
      no: "Assente",
      gamba_destra: "Presente a destra",
      gamba_sinistra: "Presente a sinistra",
      entrambe: "Presente in entrambe le gambe",
    };
  const predominanceLabel: Record<"destra" | "sinistra" | "uguale", string> = {
    destra: "Maggiormente a destra",
    sinistra: "Maggiormente a sinistra",
    uguale: "Simmetrico/uguale",
  };
  const systemicLabel: Record<
    RmLombosacraleInput["systemicPathologies"][number],
    string
  > = {
    oncologica: "Oncologica",
    infettiva: "Infettiva",
    reumatologica: "Reumatologica",
    metabolica: "Metabolica",
    immunologica: "Immunologica",
    altra: "Altra",
  };
  const consultationLabel: Record<
    RmLombosacraleInput["specialistConsultations"][number],
    string
  > = {
    neurochirurgica: "Neurochirurgica",
    ortopedica: "Ortopedica",
    fisiatrica: "Fisiatrica",
    neurologica: "Neurologica",
    algologica: "Algologica",
    altro: "Altro",
  };
  const imagingLabel: Record<RmLombosacraleInput["previousImagingTypes"][number], string> = {
    radiografia: "Radiografia",
    tc: "TC",
    rm: "RM",
    ecografia: "Ecografia",
    scintigrafia: "Scintigrafia",
    altro: "Altro",
  };
  const procedureLabel: Record<
    RmLombosacraleInput["priorLumbarProcedureTypes"][number],
    string
  > = {
    artrodesi: "Artrodesi",
    discectomia: "Discectomia",
    laminectomia: "Laminectomia",
    infiltrazioni: "Infiltrazioni",
    altro: "Altro",
  };
  const legPainLabel: Record<RmLombosacraleInput["legPainReachLevel"], string> = {
    solo_lombare: "Solo regione lombare",
    gluteo: "Fino al gluteo",
    coscia: "Fino alla coscia",
    ginocchio: "Fino al ginocchio",
    polpaccio: "Fino al polpaccio",
    caviglia: "Fino alla caviglia",
    piede: "Fino al piede",
    dita: "Fino alle dita del piede",
  };

  const { data, result } = params;
  const pdfDoc = await PDFDocument.create();
  const pageSize: [number, number] = [595, 842];
  let page = pdfDoc.addPage(pageSize);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const marginX = 44;
  const contentWidth = pageSize[0] - marginX * 2;
  const topY = 805;
  const footerY = 54;
  let y = 805;

  const colorPrimary = rgb(0.06, 0.36, 0.66);
  const colorBorder = rgb(0.85, 0.88, 0.92);
  const colorMuted = rgb(0.36, 0.41, 0.48);
  const colorSoftBg = rgb(0.96, 0.98, 1);

  const ensureSpace = (minHeight: number) => {
    if (y - minHeight > footerY) return;
    page = pdfDoc.addPage(pageSize);
    y = topY;
  };

  const drawSectionTitle = (title: string) => {
    ensureSpace(20);
    page.drawText(title, {
      x: marginX,
      y,
      size: 11,
      font: fontBold,
      color: colorPrimary,
    });
    y -= 16;
  };

  const drawKeyValue = (label: string, value: string) => {
    ensureSpace(20);
    page.drawText(label, {
      x: marginX,
      y,
      size: 10.5,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.1),
    });

    const wrapped = splitLinesByWidth({
      text: value,
      maxWidth: contentWidth - 150,
      size: 10.5,
      widthOfTextAtSize: font.widthOfTextAtSize.bind(font),
    });

    let localY = y;
    for (const line of wrapped) {
      if (localY < footerY + 20) {
        page = pdfDoc.addPage(pageSize);
        localY = topY;
      }
      page.drawText(line, {
        x: marginX + 150,
        y: localY,
        size: 10.5,
        font,
        color: rgb(0.15, 0.15, 0.15),
      });
      localY -= 14;
    }
    y = localY - 2;
  };

  page.drawRectangle({
    x: marginX,
    y: y - 38,
    width: contentWidth,
    height: 42,
    color: colorPrimary,
  });
  page.drawText("SCANRIGHT", {
    x: marginX + 12,
    y: y - 22,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Report anamnestico RM lombosacrale", {
    x: marginX + 108,
    y: y - 22,
    size: 11,
    font,
    color: rgb(1, 1, 1),
  });
  y -= 56;

  page.drawRectangle({
    x: marginX,
    y: y - 32,
    width: contentWidth,
    height: 36,
    color: colorSoftBg,
    borderColor: colorBorder,
    borderWidth: 1,
  });
  page.drawText(`Esito: ${result.level.toUpperCase()}  |  Score: ${result.score}/100`, {
    x: marginX + 12,
    y: y - 20,
    size: 11,
    font: fontBold,
    color: colorPrimary,
  });
  y -= 48;

  drawSectionTitle("Dati paziente e contesto");
  drawKeyValue("Codice paziente", data.patientCode);
  drawKeyValue("Eta", `${data.patientAge} anni`);
  drawKeyValue("Email radiologo", data.radiologistEmail);
  drawKeyValue("Durata sintomi", `${data.symptomsDurationWeeks} settimane`);
  drawKeyValue(
    "Terapia conservativa",
    `${data.conservativeTreatmentWeeks} settimane`,
  );
  y -= 6;

  drawSectionTitle("Indicatori clinici");
  drawKeyValue("Trauma recente", yesNoToText(data.traumaRecent));
  drawKeyValue(
    "Deficit neurologico agli arti inferiori",
    neurologicalDeficitLabel[data.neurologicalDeficit],
  );
  if (data.neurologicalDeficit === "entrambe" && data.neurologicalDeficitPredominance) {
    drawKeyValue(
      "Deficit prevalente",
      predominanceLabel[data.neurologicalDeficitPredominance],
    );
  }
  drawKeyValue(
    "Sospetta sindrome della cauda equina",
    yesNoToText(data.suspectCaudaEquina),
  );
  drawKeyValue(
    "Febbre o segni infettivi",
    yesNoToText(data.feverOrInfectionSigns),
  );
  drawKeyValue(
    "Patologie sistemiche",
    data.systemicPathologies.length > 0
      ? data.systemicPathologies.map((item) => systemicLabel[item]).join(", ")
      : "Nessuna riportata",
  );
  drawKeyValue(
    "Patologia sistemica campo libero (legacy)",
    data.systemicPathologiesOther?.trim() ? data.systemicPathologiesOther : "Non compilato",
  );
  for (const pathology of data.systemicPathologies) {
    const detail = data.systemicPathologyDetails[pathology];
    if (detail && detail.trim().length > 0) {
      drawKeyValue(`Dettaglio ${systemicLabel[pathology]}`, detail);
    }
  }
  drawKeyValue(
    "Calo ponderale inspiegato",
    yesNoToText(data.unexplainedWeightLoss),
  );
  drawKeyValue(
    "Uso steroidi / osteoporosi",
    yesNoToText(data.steroidUseOrOsteoporosis),
  );
  drawKeyValue(
    "Pregressa chirurgia lombare",
    yesNoToText(data.priorLumbarSurgery),
  );
  if (data.priorLumbarSurgery === "si") {
    drawKeyValue(
      "Tipologia intervento/procedura",
      data.priorLumbarProcedureTypes.length > 0
        ? data.priorLumbarProcedureTypes.map((item) => procedureLabel[item]).join(", ")
        : "Non specificato",
    );
    if (data.priorLumbarProcedureTypes.includes("altro") && data.priorLumbarProcedureOther) {
      drawKeyValue("Dettaglio altra procedura", data.priorLumbarProcedureOther);
    }
  }
  drawKeyValue("Dolore non in miglioramento", yesNoToText(data.painNotImproving));
  drawKeyValue("Irradiazione dolore arto inferiore", legPainLabel[data.legPainReachLevel]);
  drawKeyValue(
    "Consulenze specialistiche",
    data.specialistConsultations.length > 0
      ? data.specialistConsultations
          .map((item) => consultationLabel[item])
          .join(", ")
      : "Nessuna",
  );
  drawKeyValue(
    "Consulenza campo libero (legacy)",
    data.specialistConsultationsOther?.trim()
      ? data.specialistConsultationsOther
      : "Non compilato",
  );
  if (data.specialistConsultations.includes("altro") && data.specialistConsultationsOther) {
    drawKeyValue("Dettaglio altra consulenza", data.specialistConsultationsOther);
  }
  drawKeyValue("Esami precedenti eseguiti", yesNoToText(data.previousImagingDone));
  if (data.previousImagingDone === "si") {
    drawKeyValue(
      "Tipologia esami precedenti",
      data.previousImagingTypes.length > 0
        ? data.previousImagingTypes.map((item) => imagingLabel[item]).join(", ")
        : "Non specificato",
    );
    if (data.previousImagingTypes.includes("altro") && data.previousImagingOther) {
      drawKeyValue("Dettaglio altro esame", data.previousImagingOther);
    }
    drawKeyValue(
      "Esito sintetico esami precedenti",
      data.previousImagingSummary?.trim()
        ? data.previousImagingSummary
        : "Non riportato",
    );
  }
  drawKeyValue(
    "Consenso trasmissione dati",
    data.consentDataTransmission ? "Acquisito" : "Non acquisito",
  );
  y -= 4;

  drawSectionTitle("Raccomandazione");
  drawKeyValue("Indicazione clinica", result.recommendation);
  y -= 2;

  drawSectionTitle("Motivazioni principali");
  for (const reason of result.reasons) {
    const lines = splitLinesByWidth({
      text: `- ${reason}`,
      maxWidth: contentWidth - 8,
      size: 10.2,
      widthOfTextAtSize: font.widthOfTextAtSize.bind(font),
    });

    for (const line of lines) {
      ensureSpace(16);
      page.drawText(line, {
        x: marginX + 4,
        y,
        size: 10.2,
        font,
        color: rgb(0.16, 0.16, 0.16),
      });
      y -= 13;
    }
    y -= 3;
  }

  y -= 4;
  drawSectionTitle("Note cliniche");
  drawKeyValue(
    "Annotazioni",
    data.notes && data.notes.trim().length > 0 ? data.notes : "Nessuna",
  );

  for (const reportPage of pdfDoc.getPages()) {
    reportPage.drawLine({
      start: { x: marginX, y: 54 },
      end: { x: marginX + contentWidth, y: 54 },
      thickness: 1,
      color: colorBorder,
    });
    reportPage.drawText(`Generato il ${new Date().toLocaleString("it-IT")}`, {
      x: marginX,
      y: 38,
      size: 9.5,
      font,
      color: colorMuted,
    });
    reportPage.drawText("scanright.it", {
      x: marginX + contentWidth - 62,
      y: 38,
      size: 9.5,
      font: fontBold,
      color: colorPrimary,
    });
  }

  return await pdfDoc.save();
}
