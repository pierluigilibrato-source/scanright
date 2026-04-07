"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { evaluateRmLombosacraleAppropriateness, type AppropriatenessResult, type UrgencyLevel } from "@/lib/rm-lombosacrale-rules";
import type { RmLombosacraleInput } from "@/lib/schema";

const URGENCY_LABEL: Record<UrgencyLevel, string> = {
  emergenza: "Emergenza",
  urgente_differibile: "Urgente differibile",
  da_valutare: "Da valutare",
  non_urgente: "Non urgente",
};

const URGENCY_BADGE: Record<UrgencyLevel, string> = {
  emergenza: "bg-red-600 text-white",
  urgente_differibile: "bg-orange-100 text-orange-800 border border-orange-200",
  da_valutare: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  non_urgente: "bg-zinc-100 text-zinc-500 border border-zinc-200",
};

const LEVEL_BADGE: Record<string, string> = {
  appropriata: "bg-red-100 text-red-800 border border-red-200",
  "da rivalutare": "bg-amber-100 text-amber-800 border border-amber-200",
  "non appropriata": "bg-zinc-100 text-zinc-600 border border-zinc-200",
};

type FormState = RmLombosacraleInput;

const steps = [
  "Dati iniziali",
  "Dolore e durata",
  "Deficit neurologico",
  "Patologie sistemiche",
  "Consulenze e interventi",
  "Esami precedenti",
  "Consenso e invio",
] as const;

const initialState: FormState = {
  patientCode: "",
  patientAge: 45,
  radiologistEmail: "",
  symptomsDurationWeeks: 2,
  conservativeTreatmentWeeks: 0,
  painNotImproving: "no",
  traumaRecent: "no",
  suspectCaudaEquina: "no",
  feverOrInfectionSigns: "no",
  unexplainedWeightLoss: "no",
  steroidUseOrOsteoporosis: "no",
  priorLumbarSurgery: "no",
  neurologicalDeficit: "no",
  neurologicalDeficitPredominance: undefined,
  systemicPathologies: [],
  systemicPathologiesOther: "",
  specialistConsultations: [],
  specialistConsultationsOther: "",
  systemicPathologyDetails: {
    oncologica: "",
    infettiva: "",
    reumatologica: "",
    metabolica: "",
    immunologica: "",
    altra: "",
  },
  legPainReachLevel: "solo_lombare",
  priorLumbarProcedureTypes: [],
  priorLumbarProcedureOther: "",
  previousImagingDone: "no",
  previousImagingTypes: [],
  previousImagingOther: "",
  previousImagingSummary: "",
  consentDataTransmission: false,
  notes: "",
};

const yesNo = [
  { value: "si", label: "Si" },
  { value: "no", label: "No" },
] as const;

const systemicOptions = ["oncologica", "infettiva", "reumatologica", "metabolica", "immunologica", "altra"] as const;
const specialistOptions = ["neurochirurgica", "ortopedica", "fisiatrica", "neurologica", "algologica", "altro"] as const;
const previousExamOptions = ["radiografia", "tc", "rm", "ecografia", "scintigrafia", "altro"] as const;
const procedureOptions = ["artrodesi", "discectomia", "laminectomia", "infiltrazioni", "altro"] as const;

export default function RmLombosacralePage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [step, setStep] = useState(0);
  const [simpleLanguage, setSimpleLanguage] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<AppropriatenessResult | null>(null);
  const [submittedCode, setSubmittedCode] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();
  const preview = useMemo(() => evaluateRmLombosacraleAppropriateness(form), [form]);
  const t = (standard: string, simple: string) =>
    simpleLanguage ? simple : standard;

  const toggle = (
    key:
      | "systemicPathologies"
      | "specialistConsultations"
      | "previousImagingTypes"
      | "priorLumbarProcedureTypes",
    value: string,
  ) => {
    setForm((prev) => {
      const arr = prev[key] as string[];
      return {
        ...prev,
        [key]: arr.includes(value)
          ? arr.filter((item) => item !== value)
          : [...arr, value],
      };
    });
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (step < steps.length - 1) return;

    setIsSubmitting(true);
    setMessage("");
    try {
      const response = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error ?? "Errore invio questionario");
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `report-rm-lombosacrale-${form.patientCode || "paziente"}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setSubmittedResult(preview);
      setSubmittedCode(form.patientCode);
      setSubmitted(true);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore inatteso");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  if (submitted && submittedResult) {
    return (
      <main className="mx-auto w-full max-w-2xl px-6 py-16">
        <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-zinc-900">Questionario inviato</h2>
          <p className="mt-2 text-sm text-zinc-500">
            Il report PDF è stato generato e scaricato automaticamente.
            Puoi ritrovarlo nella worklist in qualsiasi momento.
          </p>

          <div className="mt-6 rounded-xl border border-sky-100 bg-sky-50 p-5 text-left">
            <p className="text-xs font-bold uppercase tracking-widest text-sky-700 mb-3">Valutazione — {submittedCode}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`rounded-full px-3 py-1 text-sm font-bold ${URGENCY_BADGE[submittedResult.urgency]}`}>
                {URGENCY_LABEL[submittedResult.urgency]}
              </span>
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${LEVEL_BADGE[submittedResult.level] ?? ""}`}>
                {submittedResult.level.charAt(0).toUpperCase() + submittedResult.level.slice(1)}
              </span>
              <span className="text-sm font-semibold text-sky-900">Score {submittedResult.score}/100</span>
            </div>
            <p className="mt-3 text-sm text-zinc-700">{submittedResult.recommendation}</p>
          </div>

          <div className="mt-6 flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/worklist"
              className="rounded-lg bg-sky-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800"
            >
              Vedi Worklist
            </Link>
            <button
              onClick={() => {
                setSubmitted(false);
                setSubmittedResult(null);
                setStep(0);
              }}
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Nuovo questionario
            </button>
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="rounded-2xl border border-sky-100 bg-linear-to-r from-sky-50 to-white p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900">
              ScanRight - Questionario RM lombosacrale
            </h1>
            <p className="mt-1 text-sm text-zinc-600">
              {t(
                "Percorso guidato per il paziente con spiegazioni semplici e dettagli clinici.",
                "Compila passo per passo: domande chiare e facili da capire.",
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard"
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Dashboard
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
            >
              {isLoggingOut ? "Uscita..." : "Logout"}
            </button>
          </div>
        </div>
        <label className="mt-4 inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm">
          <input
            type="checkbox"
            checked={simpleLanguage}
            onChange={(e) => setSimpleLanguage(e.target.checked)}
          />
          Modalita linguaggio ultra-semplice
        </label>
      </header>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
          <div>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-semibold text-zinc-700">
                Step {step + 1} di {steps.length}
              </span>
              <span className="text-zinc-500">{steps[step]}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-zinc-100">
              <div
                className="h-2 rounded-full bg-sky-700 transition-all"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Codice paziente
                <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.patientCode} onChange={(e) => setForm((p) => ({ ...p, patientCode: e.target.value }))} required />
              </label>
              <label className="text-sm font-medium">{t("Eta", "Quanti anni hai?")}
                <input className="mt-1 w-full rounded-lg border px-3 py-2" type="number" min={1} max={120} value={form.patientAge} onChange={(e) => setForm((p) => ({ ...p, patientAge: Number(e.target.value) }))} required />
              </label>
              <label className="text-sm font-medium sm:col-span-2">
                {t("Email radiologo", "Email del medico radiologo")}
                <input className="mt-1 w-full rounded-lg border px-3 py-2" type="email" value={form.radiologistEmail} onChange={(e) => setForm((p) => ({ ...p, radiologistEmail: e.target.value }))} required />
              </label>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <label className="block text-sm font-medium">
                {t(
                  "Durata sintomi (settimane)",
                  "Da quante settimane hai dolore o fastidio?",
                )}
                <input className="mt-1 w-full rounded-lg border px-3 py-2" type="number" min={0} max={520} value={form.symptomsDurationWeeks} onChange={(e) => setForm((p) => ({ ...p, symptomsDurationWeeks: Number(e.target.value) }))} required />
              </label>
              <label className="block text-sm font-medium">
                {t(
                  "Durata terapia conservativa (settimane)",
                  "Da quante settimane stai facendo cure (farmaci/fisio/esercizi)?",
                )}
                <input className="mt-1 w-full rounded-lg border px-3 py-2" type="number" min={0} max={104} value={form.conservativeTreatmentWeeks} onChange={(e) => setForm((p) => ({ ...p, conservativeTreatmentWeeks: Number(e.target.value) }))} required />
              </label>
              <div className="rounded-xl border p-4">
                <p className="text-sm font-semibold">
                  {t(
                    "Il dolore migliora con la terapia?",
                    "Con le cure stai meglio?",
                  )}
                </p>
                <div className="mt-2 flex gap-4">
                  {yesNo.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={form.painNotImproving === opt.value} onChange={() => setForm((p) => ({ ...p, painNotImproving: opt.value }))} />
                      {opt.value === "si" ? "No, non migliora" : "Si, migliora"}
                    </label>
                  ))}
                </div>
              </div>
              <label className="block text-sm font-medium">
                {t(
                  "Fino a quale livello dell'arto inferiore arriva il dolore?",
                  "Fino a dove arriva il dolore nella gamba?",
                )}
                <select className="mt-1 w-full rounded-lg border px-3 py-2" value={form.legPainReachLevel} onChange={(e) => setForm((p) => ({ ...p, legPainReachLevel: e.target.value as FormState["legPainReachLevel"] }))}>
                  <option value="solo_lombare">Solo lombare</option>
                  <option value="gluteo">Gluteo</option>
                  <option value="coscia">Coscia</option>
                  <option value="ginocchio">Ginocchio</option>
                  <option value="polpaccio">Polpaccio</option>
                  <option value="caviglia">Caviglia</option>
                  <option value="piede">Piede</option>
                  <option value="dita">Dita del piede</option>
                </select>
              </label>
            </div>
          )}

          {step === 2 && (
            <div className="rounded-xl border p-4">
              <p className="text-sm font-semibold">
                {t("Deficit neurologico", "Debolezza o perdita di sensibilita alla gamba")}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {t(
                  "Debolezza, perdita sensibilita o difficolta motoria.",
                  "Per esempio: gamba meno forte, formicolio, difficolta a muovere il piede.",
                )}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {[
                  { value: "no", label: "No" },
                  { value: "gamba_destra", label: "Gamba destra" },
                  { value: "gamba_sinistra", label: "Gamba sinistra" },
                  { value: "entrambe", label: "Entrambe" },
                ].map((item) => (
                  <label key={item.value} className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={form.neurologicalDeficit === item.value} onChange={() => setForm((p) => ({ ...p, neurologicalDeficit: item.value as FormState["neurologicalDeficit"] }))} />
                    {item.label}
                  </label>
                ))}
              </div>
              {form.neurologicalDeficit === "entrambe" && (
                <div className="mt-3">
                  <p className="text-sm">Maggiormente a destra o sinistra?</p>
                  <div className="mt-2 flex gap-4">
                    {[
                      { value: "destra", label: "Destra" },
                      { value: "sinistra", label: "Sinistra" },
                      { value: "uguale", label: "Uguale" },
                    ].map((item) => (
                      <label key={item.value} className="flex items-center gap-2 text-sm">
                        <input type="radio" checked={form.neurologicalDeficitPredominance === item.value} onChange={() => setForm((p) => ({ ...p, neurologicalDeficitPredominance: item.value as FormState["neurologicalDeficitPredominance"] }))} />
                        {item.label}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="rounded-xl border p-4">
              <p className="text-sm font-semibold">
                {t("Patologie sistemiche", "Altre malattie importanti")}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {t(
                  "Per ogni voce selezionata scrivere quale patologia (esempio: oncologica K mammella; reumatologica artrite reumatoide).",
                  "Se selezioni una voce, scrivi quale malattia hai (esempio: tumore al seno, artrite reumatoide).",
                )}
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {systemicOptions.map((item) => (
                  <label key={item} className="flex items-center gap-2 text-sm">
                    <input type="checkbox" checked={form.systemicPathologies.includes(item)} onChange={() => toggle("systemicPathologies", item)} />
                    {item}
                  </label>
                ))}
              </div>
              {form.systemicPathologies.map((item) => (
                <label key={item} className="mt-3 block text-sm font-medium">
                  Dettaglio {item}
                  <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.systemicPathologyDetails[item] || ""} onChange={(e) => setForm((p) => ({ ...p, systemicPathologyDetails: { ...p.systemicPathologyDetails, [item]: e.target.value } }))} required />
                </label>
              ))}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="rounded-xl border p-4">
                <p className="text-sm font-semibold">
                  {t(
                    "Consulenze specialistiche eseguite",
                    "Visite specialistiche gia fatte",
                  )}
                </p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  {specialistOptions.map((item) => (
                    <label key={item} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={form.specialistConsultations.includes(item)} onChange={() => toggle("specialistConsultations", item)} />
                      {item}
                    </label>
                  ))}
                </div>
                {form.specialistConsultations.includes("altro") && (
                  <label className="mt-3 block text-sm font-medium">
                    Specificare altro
                    <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.specialistConsultationsOther} onChange={(e) => setForm((p) => ({ ...p, specialistConsultationsOther: e.target.value }))} required />
                  </label>
                )}
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-sm font-semibold">
                  {t(
                    "Interventi/procedure lombari pregresse",
                    "Interventi o infiltrazioni gia fatti alla schiena",
                  )}
                </p>
                <div className="mt-2 flex gap-4">
                  {yesNo.map((opt) => (
                    <label key={opt.value} className="flex items-center gap-2 text-sm">
                      <input type="radio" checked={form.priorLumbarSurgery === opt.value} onChange={() => setForm((p) => ({ ...p, priorLumbarSurgery: opt.value }))} />
                      {opt.label}
                    </label>
                  ))}
                </div>
                {form.priorLumbarSurgery === "si" && (
                  <div className="mt-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      {procedureOptions.map((item) => (
                        <label key={item} className="flex items-center gap-2 text-sm">
                          <input type="checkbox" checked={form.priorLumbarProcedureTypes.includes(item)} onChange={() => toggle("priorLumbarProcedureTypes", item)} />
                          {item}
                        </label>
                      ))}
                    </div>
                    {form.priorLumbarProcedureTypes.includes("altro") && (
                      <label className="mt-3 block text-sm font-medium">
                        Specificare altro
                        <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.priorLumbarProcedureOther} onChange={(e) => setForm((p) => ({ ...p, priorLumbarProcedureOther: e.target.value }))} required />
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="rounded-xl border p-4">
              <p className="text-sm font-semibold">
                {t("Esami precedenti", "Esami gia fatti in passato")}
              </p>
              <div className="mt-2 flex gap-4">
                {yesNo.map((opt) => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm">
                    <input type="radio" checked={form.previousImagingDone === opt.value} onChange={() => setForm((p) => ({ ...p, previousImagingDone: opt.value }))} />
                    {opt.label}
                  </label>
                ))}
              </div>
              {form.previousImagingDone === "si" && (
                <div className="mt-3 space-y-3">
                  <div className="grid gap-2 sm:grid-cols-2">
                    {previousExamOptions.map((item) => (
                      <label key={item} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" checked={form.previousImagingTypes.includes(item)} onChange={() => toggle("previousImagingTypes", item)} />
                        {item}
                      </label>
                    ))}
                  </div>
                  {form.previousImagingTypes.includes("altro") && (
                    <label className="block text-sm font-medium">
                      Specificare altro esame
                      <input className="mt-1 w-full rounded-lg border px-3 py-2" value={form.previousImagingOther} onChange={(e) => setForm((p) => ({ ...p, previousImagingOther: e.target.value }))} required />
                    </label>
                  )}
                  <label className="block text-sm font-medium">
                    {t("Breve esito", "Scrivi in breve il risultato")}
                    <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={3} value={form.previousImagingSummary} onChange={(e) => setForm((p) => ({ ...p, previousImagingSummary: e.target.value }))} />
                  </label>
                </div>
              )}
            </div>
          )}

          {step === 6 && (
            <div className="space-y-4">
              {[
                { key: "traumaRecent", label: "Trauma recente" },
                { key: "suspectCaudaEquina", label: "Sospetta cauda equina" },
                { key: "feverOrInfectionSigns", label: "Febbre o segni infettivi" },
                { key: "unexplainedWeightLoss", label: "Calo ponderale inspiegato" },
                { key: "steroidUseOrOsteoporosis", label: "Steroidi/osteoporosi" },
              ].map((item) => (
                <div key={item.key} className="rounded-xl border p-4">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <div className="mt-2 flex gap-4">
                    {yesNo.map((opt) => (
                      <label key={opt.value} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          checked={form[item.key as keyof FormState] === opt.value}
                          onChange={() => setForm((p) => ({ ...p, [item.key]: opt.value }))}
                        />
                        {opt.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <label className="block text-sm font-medium">
                {t("Note aggiuntive", "Altre informazioni utili")}
                <textarea className="mt-1 w-full rounded-lg border px-3 py-2" rows={4} value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
              </label>
              <label className="flex items-start gap-3 rounded-xl border bg-zinc-50 p-4 text-sm">
                <input type="checkbox" className="mt-0.5" checked={form.consentDataTransmission} onChange={(e) => setForm((p) => ({ ...p, consentDataTransmission: e.target.checked }))} required />
                <span>
                  {t(
                    "Presto consenso informato alla trasmissione dei dati al radiologo.",
                    "Autorizzo l'invio dei miei dati clinici al radiologo per preparare l'esame.",
                  )}
                </span>
              </label>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button type="button" className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50" disabled={step === 0 || isSubmitting} onClick={() => setStep((s) => Math.max(0, s - 1))}>
              Indietro
            </button>
            {step < steps.length - 1 ? (
              <button type="button" className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
                Avanti
              </button>
            ) : (
              <button type="submit" className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50" disabled={isSubmitting || !form.consentDataTransmission}>
                {isSubmitting ? "Generazione report..." : "Invia e genera PDF"}
              </button>
            )}
          </div>

          {message ? <p className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">{message}</p> : null}
        </form>

        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs lg:sticky lg:top-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            Anteprima report
          </p>
          <h3 className="mt-2 text-lg font-semibold text-zinc-900">
            RM lombosacrale - {form.patientCode || "Paziente non impostato"}
          </h3>
          <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
              Valutazione automatica
            </p>
            <p className="mt-1 text-base font-bold text-sky-900">
              {preview.level.toUpperCase()}
            </p>
            <p className="text-sm text-sky-800">Score: {preview.score}/100</p>
            <p className="mt-2 text-sm text-zinc-700">{preview.recommendation}</p>
          </div>
        </aside>
      </section>
    </main>
  );
}
