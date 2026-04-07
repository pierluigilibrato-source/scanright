import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

import type { RmLombosacraleInput } from "@/lib/schema";
import type { AppropriatenessResult } from "@/lib/rm-lombosacrale-rules";

function wrapText(
  text: string,
  maxWidth: number,
  size: number,
  widthFn: (t: string, s: number) => number,
): string[] {
  if (!text.trim()) return ["—"];
  const words = text.trim().split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (widthFn(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : ["—"];
}

const URGENCY_LABEL: Record<string, string> = {
  emergenza: "EMERGENZA",
  urgente_differibile: "URGENTE DIFFERIBILE",
  da_valutare: "DA VALUTARE",
  non_urgente: "NON URGENTE",
};

const LEVEL_LABEL: Record<string, string> = {
  appropriata: "APPROPRIATA",
  "da rivalutare": "DA RIVALUTARE",
  "non appropriata": "NON APPROPRIATA",
};

export async function buildRmReportPdf(params: {
  data: RmLombosacraleInput;
  result: AppropriatenessResult;
}) {
  const { data, result } = params;

  // ── Labels ────────────────────────────────────────────────────────────────
  const neuroLabel: Record<string, string> = {
    no: "Assente",
    gamba_destra: "Presente a destra",
    gamba_sinistra: "Presente a sinistra",
    entrambe: "Presente in entrambe le gambe",
  };
  const predominanceLabel: Record<string, string> = {
    destra: "Maggiormente a destra",
    sinistra: "Maggiormente a sinistra",
    uguale: "Simmetrico / uguale",
  };
  const systemicLabel: Record<string, string> = {
    oncologica: "Oncologica",
    infettiva: "Infettiva",
    reumatologica: "Reumatologica",
    metabolica: "Metabolica",
    immunologica: "Immunologica",
    altra: "Altra",
  };
  const consultationLabel: Record<string, string> = {
    neurochirurgica: "Neurochirurgica",
    ortopedica: "Ortopedica",
    fisiatrica: "Fisiatrica",
    neurologica: "Neurologica",
    algologica: "Algologica",
    altro: "Altro",
  };
  const imagingLabel: Record<string, string> = {
    radiografia: "Radiografia",
    tc: "TC",
    rm: "RM",
    ecografia: "Ecografia",
    scintigrafia: "Scintigrafia",
    altro: "Altro",
  };
  const procedureLabel: Record<string, string> = {
    artrodesi: "Artrodesi",
    discectomia: "Discectomia",
    laminectomia: "Laminectomia",
    infiltrazioni: "Infiltrazioni",
    altro: "Altro",
  };
  const legPainLabel: Record<string, string> = {
    solo_lombare: "Solo regione lombare",
    gluteo: "Fino al gluteo",
    coscia: "Fino alla coscia",
    ginocchio: "Fino al ginocchio",
    polpaccio: "Fino al polpaccio",
    caviglia: "Fino alla caviglia",
    piede: "Fino al piede",
    dita: "Fino alle dita del piede",
  };

  // ── Page setup ─────────────────────────────────────────────────────────────
  const pdfDoc = await PDFDocument.create();
  const PAGE_W = 595;
  const PAGE_H = 842;
  const MARGIN = 44;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const LABEL_W = 210;
  const VALUE_X = MARGIN + LABEL_W + 8;
  const VALUE_W = CONTENT_W - LABEL_W - 8;
  const FOOTER_Y = 54;
  const TOP_Y = 800;
  const LINE_H = 14;
  const ROW_PAD = 4;
  const FONT_SIZE = 9.5;

  let page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  let y = TOP_Y;
  let rowIndex = 0;

  const colorPrimary = rgb(0.06, 0.36, 0.66);
  const colorBorder = rgb(0.82, 0.87, 0.93);
  const colorMuted = rgb(0.4, 0.45, 0.52);
  const colorRowAlt = rgb(0.97, 0.98, 1.0);
  const colorSectionBg = rgb(0.94, 0.97, 1.0);

  const wf = (t: string, s: number) => font.widthOfTextAtSize(t, s);
  const wfb = (t: string, s: number) => fontBold.widthOfTextAtSize(t, s);

  const ensureSpace = (h: number) => {
    if (y - h > FOOTER_Y) return;
    // footer on current page
    drawFooter();
    page = pdfDoc.addPage([PAGE_W, PAGE_H]);
    y = TOP_Y;
    rowIndex = 0;
  };

  const drawFooter = () => {
    page.drawLine({
      start: { x: MARGIN, y: 54 },
      end: { x: MARGIN + CONTENT_W, y: 54 },
      thickness: 0.5,
      color: colorBorder,
    });
    page.drawText(`Generato il ${new Date().toLocaleString("it-IT")}`, {
      x: MARGIN,
      y: 38,
      size: 8.5,
      font,
      color: colorMuted,
    });
    page.drawText("scanright.it  —  uso interno", {
      x: MARGIN + CONTENT_W - 120,
      y: 38,
      size: 8.5,
      font: fontBold,
      color: colorPrimary,
    });
  };

  // ── Section title ──────────────────────────────────────────────────────────
  const drawSection = (title: string) => {
    ensureSpace(26);
    page.drawRectangle({
      x: MARGIN,
      y: y - 18,
      width: CONTENT_W,
      height: 20,
      color: colorSectionBg,
    });
    page.drawLine({
      start: { x: MARGIN, y: y - 18 },
      end: { x: MARGIN + CONTENT_W, y: y - 18 },
      thickness: 0.5,
      color: colorBorder,
    });
    page.drawText(title.toUpperCase(), {
      x: MARGIN + 6,
      y: y - 13,
      size: 8,
      font: fontBold,
      color: colorPrimary,
    });
    y -= 24;
    rowIndex = 0;
  };

  // ── Key-value row (both label and value wrap) ──────────────────────────────
  const drawRow = (label: string, value: string) => {
    const labelLines = wrapText(label, LABEL_W - 4, FONT_SIZE, wfb);
    const valueLines = wrapText(value || "—", VALUE_W, FONT_SIZE, wf);
    const numLines = Math.max(labelLines.length, valueLines.length);
    const rowH = numLines * LINE_H + ROW_PAD * 2;

    ensureSpace(rowH);

    // alternating background
    if (rowIndex % 2 === 1) {
      page.drawRectangle({
        x: MARGIN,
        y: y - rowH + ROW_PAD,
        width: CONTENT_W,
        height: rowH,
        color: colorRowAlt,
      });
    }

    // vertical separator
    page.drawLine({
      start: { x: MARGIN + LABEL_W, y: y + ROW_PAD },
      end: { x: MARGIN + LABEL_W, y: y - rowH + ROW_PAD },
      thickness: 0.4,
      color: colorBorder,
    });

    let ly = y;
    for (const line of labelLines) {
      page.drawText(line, {
        x: MARGIN + 4,
        y: ly,
        size: FONT_SIZE,
        font: fontBold,
        color: rgb(0.12, 0.12, 0.14),
      });
      ly -= LINE_H;
    }

    let vy = y;
    for (const line of valueLines) {
      page.drawText(line, {
        x: VALUE_X,
        y: vy,
        size: FONT_SIZE,
        font,
        color: rgb(0.12, 0.12, 0.14),
      });
      vy -= LINE_H;
    }

    y -= rowH;

    // bottom border
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: MARGIN + CONTENT_W, y },
      thickness: 0.3,
      color: colorBorder,
    });

    rowIndex++;
  };

  // ── HEADER ────────────────────────────────────────────────────────────────
  page.drawRectangle({
    x: MARGIN,
    y: y - 42,
    width: CONTENT_W,
    height: 46,
    color: colorPrimary,
  });
  page.drawText("SCANRIGHT", {
    x: MARGIN + 12,
    y: y - 21,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText("Report anamnestico — RM Lombosacrale", {
    x: MARGIN + 120,
    y: y - 21,
    size: 10.5,
    font,
    color: rgb(0.85, 0.93, 1),
  });
  page.drawText(`Codice: ${data.patientCode}   |   Data: ${new Date().toLocaleDateString("it-IT")}`, {
    x: MARGIN + 12,
    y: y - 36,
    size: 8.5,
    font,
    color: rgb(0.75, 0.87, 1),
  });
  y -= 52;

  // ── ESITO BOX ─────────────────────────────────────────────────────────────
  const urgency = result.urgency ?? "non_urgente";
  const urgencyText = URGENCY_LABEL[urgency] ?? urgency.toUpperCase();
  const levelText = LEVEL_LABEL[result.level] ?? result.level.toUpperCase();

  page.drawRectangle({
    x: MARGIN,
    y: y - 40,
    width: CONTENT_W,
    height: 44,
    color: rgb(0.96, 0.98, 1),
    borderColor: colorBorder,
    borderWidth: 0.8,
  });
  page.drawText("URGENZA", {
    x: MARGIN + 12,
    y: y - 14,
    size: 7.5,
    font: fontBold,
    color: colorMuted,
  });
  page.drawText(urgencyText, {
    x: MARGIN + 12,
    y: y - 28,
    size: 11,
    font: fontBold,
    color: colorPrimary,
  });
  page.drawText("APPROPRIATEZZA", {
    x: MARGIN + 170,
    y: y - 14,
    size: 7.5,
    font: fontBold,
    color: colorMuted,
  });
  page.drawText(levelText, {
    x: MARGIN + 170,
    y: y - 28,
    size: 11,
    font: fontBold,
    color: colorPrimary,
  });
  page.drawText("SCORE", {
    x: MARGIN + 340,
    y: y - 14,
    size: 7.5,
    font: fontBold,
    color: colorMuted,
  });
  page.drawText(`${result.score} / 100`, {
    x: MARGIN + 340,
    y: y - 28,
    size: 11,
    font: fontBold,
    color: colorPrimary,
  });
  y -= 52;

  // ── SECTION: Dati paziente ─────────────────────────────────────────────────
  drawSection("Dati paziente e contesto");
  drawRow("Codice paziente", data.patientCode);
  drawRow("Età", `${data.patientAge} anni`);
  drawRow("Email radiologo", data.radiologistEmail);
  drawRow("Durata sintomi", `${data.symptomsDurationWeeks} settimane`);
  drawRow("Terapia conservativa", `${data.conservativeTreatmentWeeks} settimane`);
  y -= 6;

  // ── SECTION: Indicatori clinici ────────────────────────────────────────────
  drawSection("Indicatori clinici");
  drawRow("Trauma recente", data.traumaRecent === "si" ? "Sì" : "No");
  drawRow("Sospetta cauda equina", data.suspectCaudaEquina === "si" ? "Sì" : "No");
  drawRow("Febbre / segni infettivi", data.feverOrInfectionSigns === "si" ? "Sì" : "No");
  drawRow("Calo ponderale inspiegato", data.unexplainedWeightLoss === "si" ? "Sì" : "No");
  drawRow("Uso steroidi / osteoporosi", data.steroidUseOrOsteoporosis === "si" ? "Sì" : "No");
  drawRow("Deficit neurologico", neuroLabel[data.neurologicalDeficit] ?? data.neurologicalDeficit);
  if (data.neurologicalDeficit === "entrambe" && data.neurologicalDeficitPredominance) {
    drawRow("Deficit prevalente", predominanceLabel[data.neurologicalDeficitPredominance] ?? "");
  }
  drawRow("Dolore non in miglioramento", data.painNotImproving === "si" ? "Sì" : "No");
  drawRow("Irradiazione dolore", legPainLabel[data.legPainReachLevel] ?? data.legPainReachLevel);
  y -= 6;

  // ── SECTION: Patologie sistemiche ─────────────────────────────────────────
  drawSection("Patologie sistemiche");
  drawRow(
    "Patologie riportate",
    data.systemicPathologies.length > 0
      ? data.systemicPathologies.map((p) => systemicLabel[p] ?? p).join(", ")
      : "Nessuna",
  );
  for (const pathology of data.systemicPathologies) {
    const detail = data.systemicPathologyDetails?.[pathology];
    if (detail?.trim()) {
      drawRow(`Dettaglio — ${systemicLabel[pathology] ?? pathology}`, detail);
    }
  }
  y -= 6;

  // ── SECTION: Chirurgia pregressa ───────────────────────────────────────────
  drawSection("Chirurgia lombare pregressa");
  drawRow("Pregressa chirurgia lombare", data.priorLumbarSurgery === "si" ? "Sì" : "No");
  if (data.priorLumbarSurgery === "si") {
    drawRow(
      "Tipo di intervento / procedura",
      data.priorLumbarProcedureTypes.length > 0
        ? data.priorLumbarProcedureTypes.map((p) => procedureLabel[p] ?? p).join(", ")
        : "Non specificato",
    );
    if (data.priorLumbarProcedureTypes.includes("altro") && data.priorLumbarProcedureOther?.trim()) {
      drawRow("Dettaglio altra procedura", data.priorLumbarProcedureOther);
    }
  }
  y -= 6;

  // ── SECTION: Consulenze specialistiche ────────────────────────────────────
  drawSection("Consulenze specialistiche");
  drawRow(
    "Consulenze effettuate",
    data.specialistConsultations.length > 0
      ? data.specialistConsultations.map((c) => consultationLabel[c] ?? c).join(", ")
      : "Nessuna",
  );
  if (data.specialistConsultations.includes("altro") && data.specialistConsultationsOther?.trim()) {
    drawRow("Dettaglio altra consulenza", data.specialistConsultationsOther);
  }
  y -= 6;

  // ── SECTION: Esami precedenti ──────────────────────────────────────────────
  drawSection("Esami precedenti");
  drawRow("Esami precedenti eseguiti", data.previousImagingDone === "si" ? "Sì" : "No");
  if (data.previousImagingDone === "si") {
    drawRow(
      "Tipo di esame",
      data.previousImagingTypes.length > 0
        ? data.previousImagingTypes.map((t) => imagingLabel[t] ?? t).join(", ")
        : "Non specificato",
    );
    if (data.previousImagingTypes.includes("altro") && data.previousImagingOther?.trim()) {
      drawRow("Dettaglio altro esame", data.previousImagingOther);
    }
    if (data.previousImagingSummary?.trim()) {
      drawRow("Referto / esito sintetico", data.previousImagingSummary);
    }
  }
  y -= 6;

  // ── SECTION: Raccomandazione ───────────────────────────────────────────────
  drawSection("Raccomandazione clinica");
  drawRow("Indicazione", result.recommendation);
  y -= 6;

  // ── Motivazioni ───────────────────────────────────────────────────────────
  drawSection("Motivazioni principali");
  for (const reason of result.reasons) {
    const lines = wrapText(`• ${reason}`, CONTENT_W - 12, FONT_SIZE, wf);
    ensureSpace(lines.length * LINE_H + 4);
    for (const line of lines) {
      page.drawText(line, {
        x: MARGIN + 6,
        y,
        size: FONT_SIZE,
        font,
        color: rgb(0.14, 0.14, 0.16),
      });
      y -= LINE_H;
    }
    y -= 2;
  }
  y -= 4;

  // ── Note cliniche ──────────────────────────────────────────────────────────
  drawSection("Note cliniche");
  drawRow("Consenso trasmissione dati", data.consentDataTransmission ? "Acquisito" : "Non acquisito");
  drawRow(
    "Note / annotazioni",
    data.notes?.trim() ? data.notes : "Nessuna",
  );

  // ── Footer su tutte le pagine ─────────────────────────────────────────────
  for (const p of pdfDoc.getPages()) {
    p.drawLine({
      start: { x: MARGIN, y: 54 },
      end: { x: MARGIN + CONTENT_W, y: 54 },
      thickness: 0.5,
      color: colorBorder,
    });
    p.drawText(`Generato il ${new Date().toLocaleString("it-IT")}`, {
      x: MARGIN,
      y: 38,
      size: 8.5,
      font,
      color: colorMuted,
    });
    p.drawText("scanright.it  —  uso interno", {
      x: MARGIN + CONTENT_W - 120,
      y: 38,
      size: 8.5,
      font: fontBold,
      color: colorPrimary,
    });
  }

  return await pdfDoc.save();
}
