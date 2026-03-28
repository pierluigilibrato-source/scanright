import { z } from "zod";

const legDeficitOptions = z.enum([
  "no",
  "gamba_destra",
  "gamba_sinistra",
  "entrambe",
]);
const sidePredominanceOptions = z.enum(["destra", "sinistra", "uguale"]);
const yesNoOptions = z.enum(["si", "no"]);

const systemicPathologyOptions = z.enum([
  "oncologica",
  "infettiva",
  "reumatologica",
  "metabolica",
  "immunologica",
  "altra",
]);

const specialistConsultationOptions = z.enum([
  "neurochirurgica",
  "ortopedica",
  "fisiatrica",
  "neurologica",
  "algologica",
  "altro",
]);

const previousImagingTypeOptions = z.enum([
  "radiografia",
  "tc",
  "rm",
  "ecografia",
  "scintigrafia",
  "altro",
]);

const lumbarProcedureTypeOptions = z.enum([
  "artrodesi",
  "discectomia",
  "laminectomia",
  "infiltrazioni",
  "altro",
]);

const painReachLevelOptions = z.enum([
  "solo_lombare",
  "gluteo",
  "coscia",
  "ginocchio",
  "polpaccio",
  "caviglia",
  "piede",
  "dita",
]);

export const rmLombosacraleSchema = z
  .object({
    patientCode: z.string().min(2, "Codice paziente obbligatorio"),
    patientAge: z.coerce.number().int().min(1).max(120),
    radiologistEmail: z.string().email("Email radiologo non valida"),
    symptomsDurationWeeks: z.coerce.number().min(0).max(520),
    conservativeTreatmentWeeks: z.coerce.number().min(0).max(104),

    painNotImproving: yesNoOptions,
    traumaRecent: yesNoOptions,
    suspectCaudaEquina: yesNoOptions,
    feverOrInfectionSigns: yesNoOptions,
    unexplainedWeightLoss: yesNoOptions,
    steroidUseOrOsteoporosis: yesNoOptions,
    priorLumbarSurgery: yesNoOptions,

    neurologicalDeficit: legDeficitOptions,
    neurologicalDeficitPredominance: sidePredominanceOptions.optional(),

    systemicPathologies: z
      .array(systemicPathologyOptions)
      .max(6)
      .default([]),
    systemicPathologiesOther: z.string().max(500).optional().default(""),

    specialistConsultations: z
      .array(specialistConsultationOptions)
      .max(6)
      .default([]),
    specialistConsultationsOther: z.string().max(500).optional().default(""),

    systemicPathologyDetails: z
      .object({
        oncologica: z.string().max(500).optional().default(""),
        infettiva: z.string().max(500).optional().default(""),
        reumatologica: z.string().max(500).optional().default(""),
        metabolica: z.string().max(500).optional().default(""),
        immunologica: z.string().max(500).optional().default(""),
        altra: z.string().max(500).optional().default(""),
      })
      .default({
        oncologica: "",
        infettiva: "",
        reumatologica: "",
        metabolica: "",
        immunologica: "",
        altra: "",
      }),

    legPainReachLevel: painReachLevelOptions,

    priorLumbarProcedureTypes: z
      .array(lumbarProcedureTypeOptions)
      .max(5)
      .default([]),
    priorLumbarProcedureOther: z.string().max(500).optional().default(""),

    previousImagingDone: yesNoOptions,
    previousImagingTypes: z.array(previousImagingTypeOptions).max(5).default([]),
    previousImagingOther: z.string().max(500).optional().default(""),
    previousImagingSummary: z.string().max(1000).optional().default(""),

    consentDataTransmission: z.boolean(),
    notes: z.string().max(2000).optional().default(""),
  })
  .superRefine((data, ctx) => {
    if (
      data.neurologicalDeficit === "entrambe" &&
      !data.neurologicalDeficitPredominance
    ) {
      ctx.addIssue({
        code: "custom",
        message:
          "Se il deficit e presente in entrambe le gambe, specificare dove e maggiormente evidente.",
        path: ["neurologicalDeficitPredominance"],
      });
    }

    for (const pathology of data.systemicPathologies) {
      const detail = data.systemicPathologyDetails[pathology]?.trim();
      if (!detail) {
        ctx.addIssue({
          code: "custom",
          message:
            "Per ogni patologia sistemica selezionata specificare il dettaglio clinico (es. oncologica: K mammella).",
          path: ["systemicPathologyDetails", pathology],
        });
      }
    }
    if (data.priorLumbarSurgery === "si" && data.priorLumbarProcedureTypes.length === 0) {
      ctx.addIssue({
        code: "custom",
        message:
          "Se e presente una chirurgia pregressa, selezionare almeno un tipo di intervento/procedura.",
        path: ["priorLumbarProcedureTypes"],
      });
    }

    if (
      data.priorLumbarSurgery === "si" &&
      data.priorLumbarProcedureTypes.includes("altro") &&
      !data.priorLumbarProcedureOther?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Specificare il tipo di procedura selezionata come altro.",
        path: ["priorLumbarProcedureOther"],
      });
    }


    if (data.specialistConsultations.includes("altro")) {
      const hasOtherDetail = Boolean(data.specialistConsultationsOther?.trim());
      if (!hasOtherDetail) {
        ctx.addIssue({
          code: "custom",
          message: "Specificare la consulenza selezionata come altro.",
          path: ["specialistConsultationsOther"],
        });
      }
    }

    if (data.previousImagingDone === "si" && data.previousImagingTypes.length === 0) {
      ctx.addIssue({
        code: "custom",
        message: "Se sono stati eseguiti esami precedenti, selezionare almeno un tipo.",
        path: ["previousImagingTypes"],
      });
    }

    if (
      data.previousImagingDone === "si" &&
      data.previousImagingTypes.includes("altro") &&
      !data.previousImagingOther?.trim()
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Specificare l'esame precedente selezionato come altro.",
        path: ["previousImagingOther"],
      });
    }
    if (!data.consentDataTransmission) {
      ctx.addIssue({
        code: "custom",
        message: "E necessario il consenso informato alla trasmissione dei dati.",
        path: ["consentDataTransmission"],
      });
    }
  });

export type RmLombosacraleInput = z.infer<typeof rmLombosacraleSchema>;
