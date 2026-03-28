import type { RmLombosacraleInput } from "@/lib/schema";

export type AppropriatenessLevel =
  | "appropriata"
  | "da rivalutare"
  | "non appropriata";

export type AppropriatenessResult = {
  level: AppropriatenessLevel;
  score: number;
  reasons: string[];
  recommendation: string;
};

function hasRedFlags(data: RmLombosacraleInput): string[] {
  const flags: string[] = [];
  const hasOncologicalHistory = data.systemicPathologies.includes("oncologica");
  const hasSignificantDeficit = data.neurologicalDeficit !== "no";

  if (data.suspectCaudaEquina === "si") {
    flags.push("Sospetta sindrome della cauda equina");
  }
  if (hasSignificantDeficit) {
    flags.push("Deficit neurologico riferito agli arti inferiori");
  }
  if (data.feverOrInfectionSigns === "si") {
    flags.push("Segni clinici di possibile infezione");
  }
  if (hasOncologicalHistory || data.unexplainedWeightLoss === "si") {
    flags.push("Sospetto eziologia neoplastica");
  }
  if (data.traumaRecent === "si" || data.steroidUseOrOsteoporosis === "si") {
    flags.push("Rischio frattura vertebrale");
  }

  return flags;
}

export function evaluateRmLombosacraleAppropriateness(
  data: RmLombosacraleInput,
): AppropriatenessResult {
  const reasons: string[] = [];
  const redFlags = hasRedFlags(data);
  const distalPainLevels = ["polpaccio", "caviglia", "piede", "dita"];

  if (redFlags.length > 0) {
    return {
      level: "appropriata",
      score: 95,
      reasons: [
        "Presenza di red flags cliniche che indicano imaging rapido",
        ...redFlags,
      ],
      recommendation:
        "Eseguire RM lombosacrale con priorita clinica; correlare con quadro neurologico e laboratoristico.",
    };
  }

  let score = 0;

  if (data.symptomsDurationWeeks >= 6) {
    score += 35;
    reasons.push("Lombalgia/radicolopatia persistente da almeno 6 settimane");
  } else {
    reasons.push("Sintomatologia inferiore a 6 settimane senza red flags");
  }

  if (data.conservativeTreatmentWeeks >= 6 && data.painNotImproving === "si") {
    score += 40;
    reasons.push("Fallimento del trattamento conservativo");
  } else if (
    data.conservativeTreatmentWeeks >= 3 &&
    data.painNotImproving === "si"
  ) {
    score += 20;
    reasons.push("Risposta parziale al trattamento conservativo");
  } else {
    reasons.push("Nessun chiaro fallimento del trattamento conservativo");
  }

  if (data.priorLumbarSurgery === "si") {
    score += 20;
    reasons.push("Precedente chirurgia lombare");
  }

  if (data.specialistConsultations.length > 0) {
    score += 10;
    reasons.push("Gia eseguita valutazione specialistica");
  }

  if (distalPainLevels.includes(data.legPainReachLevel)) {
    score += 10;
    reasons.push("Irradiazione distale all'arto inferiore riferita dal paziente");
  }

  if (score >= 70) {
    return {
      level: "appropriata",
      score,
      reasons,
      recommendation:
        "RM lombosacrale indicata secondo criteri clinici di persistenza e mancata risposta terapeutica.",
    };
  }

  if (score >= 40) {
    return {
      level: "da rivalutare",
      score,
      reasons,
      recommendation:
        "Valutare prosecuzione terapia conservativa o rivalutazione specialistica prima dell'imaging.",
    };
  }

  return {
    level: "non appropriata",
    score,
    reasons,
    recommendation:
      "In assenza di red flags e con sintomi recenti, privilegiare approccio conservativo e follow-up clinico.",
  };
}
