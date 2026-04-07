"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import type { RmLombosacraleInput } from "@/lib/schema";

type RecordDetail = {
  id: string;
  patient_code: string;
  patient_age: number;
  radiologist_email: string;
  appropriateness_level: string;
  appropriateness_score: number;
  recommendation: string;
  created_at: string;
  questionnaire_payload: RmLombosacraleInput;
};

const LEVEL_CONFIG: Record<string, { label: string; cls: string }> = {
  appropriata: { label: "Appropriata", cls: "bg-red-100 text-red-800 border border-red-200" },
  "da rivalutare": { label: "Da rivalutare", cls: "bg-amber-100 text-amber-800 border border-amber-200" },
  "non appropriata": { label: "Non appropriata", cls: "bg-zinc-100 text-zinc-600 border border-zinc-200" },
};

type UrgencyLevel = "emergenza" | "urgente_differibile" | "da_valutare" | "non_urgente";

const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; cls: string }> = {
  emergenza: { label: "Emergenza", cls: "bg-red-600 text-white" },
  urgente_differibile: { label: "Urgente differibile", cls: "bg-orange-100 text-orange-800 border border-orange-200" },
  da_valutare: { label: "Da valutare", cls: "bg-yellow-100 text-yellow-800 border border-yellow-200" },
  non_urgente: { label: "Non urgente", cls: "bg-zinc-100 text-zinc-500 border border-zinc-200" },
};

function deriveUrgency(level: string, score: number): UrgencyLevel {
  if (score >= 95) return "emergenza";
  if (level === "appropriata") return "urgente_differibile";
  if (level === "da rivalutare") return "da_valutare";
  return "non_urgente";
}

const SYSTEMIC_LABEL: Record<string, string> = {
  oncologica: "Oncologica",
  infettiva: "Infettiva",
  reumatologica: "Reumatologica",
  metabolica: "Metabolica",
  immunologica: "Immunologica",
  altra: "Altra",
};

const CONSULTATION_LABEL: Record<string, string> = {
  neurochirurgica: "Neurochirurgica",
  ortopedica: "Ortopedica",
  fisiatrica: "Fisiatrica",
  neurologica: "Neurologica",
  algologica: "Algologica",
  altro: "Altro",
};

const IMAGING_LABEL: Record<string, string> = {
  radiografia: "Radiografia",
  tc: "TC",
  rm: "RM",
  ecografia: "Ecografia",
  scintigrafia: "Scintigrafia",
  altro: "Altro",
};

const PROCEDURE_LABEL: Record<string, string> = {
  artrodesi: "Artrodesi",
  discectomia: "Discectomia",
  laminectomia: "Laminectomia",
  infiltrazioni: "Infiltrazioni",
  altro: "Altro",
};

const NEURO_LABEL: Record<string, string> = {
  no: "Assente",
  gamba_destra: "Presente a destra",
  gamba_sinistra: "Presente a sinistra",
  entrambe: "Presente in entrambe le gambe",
};

const LEG_PAIN_LABEL: Record<string, string> = {
  solo_lombare: "Solo regione lombare",
  gluteo: "Fino al gluteo",
  coscia: "Fino alla coscia",
  ginocchio: "Fino al ginocchio",
  polpaccio: "Fino al polpaccio",
  caviglia: "Fino alla caviglia",
  piede: "Fino al piede",
  dita: "Fino alle dita del piede",
};

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3 py-2 border-b border-zinc-100 last:border-0 text-sm">
      <span className="w-52 shrink-0 font-medium text-zinc-500">{label}</span>
      <span className="text-zinc-800">{value}</span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-xs">
      <h3 className="text-xs font-bold uppercase tracking-widest text-sky-700 mb-3">{title}</h3>
      {children}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WorklistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [record, setRecord] = useState<RecordDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    fetch(`/api/worklist/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Record non trovato");
        return res.json() as Promise<RecordDetail>;
      })
      .then(setRecord)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      const res = await fetch(`/api/worklist/${id}/pdf`);
      if (!res.ok) throw new Error("Errore generazione PDF");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-rm-${record?.patient_code ?? id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      alert("Errore durante la generazione del PDF.");
    } finally {
      setDownloadingPdf(false);
    }
  };

  const q = record?.questionnaire_payload;
  const lvl = record ? (LEVEL_CONFIG[record.appropriateness_level] ?? LEVEL_CONFIG["non appropriata"]) : null;
  const urgency = record ? deriveUrgency(record.appropriateness_level, record.appropriateness_score) : null;
  const urgencyCfg = urgency ? URGENCY_CONFIG[urgency] : null;

  return (
    <main className="mx-auto w-full max-w-4xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/dashboard" className="text-sky-700 hover:underline">Dashboard</Link>
            <span className="text-zinc-300">/</span>
            <Link href="/worklist" className="text-sky-700 hover:underline">Worklist</Link>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-700 font-medium">
              {record?.patient_code ?? `#${id}`}
            </span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">
            Report RM lombosacrale
          </h1>
          {record && (
            <p className="mt-0.5 text-sm text-zinc-500">
              Registrato il {formatDate(record.created_at)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf || !record}
            className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
          >
            {downloadingPdf ? "Generazione..." : "Scarica PDF"}
          </button>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            {isLoggingOut ? "Uscita..." : "Logout"}
          </button>
        </div>
      </header>

      {loading && (
        <div className="mt-10 flex justify-center text-sm text-zinc-500">
          Caricamento report...
        </div>
      )}

      {!loading && error && (
        <div className="mt-10 flex justify-center text-sm text-red-600">
          {error} —{" "}
          <Link href="/worklist" className="ml-1 underline">
            torna alla worklist
          </Link>
        </div>
      )}

      {!loading && !error && record && q && (
        <div className="mt-6 space-y-4">
          {/* Valutazione */}
          <div className="rounded-2xl border border-sky-200 bg-sky-50 p-5">
            <div className="flex flex-wrap items-center gap-3">
              {urgencyCfg && (
                <span className={`rounded-full px-3 py-1 text-sm font-bold ${urgencyCfg.cls}`}>
                  {urgencyCfg.label}
                </span>
              )}
              <span className={`rounded-full px-3 py-1 text-sm font-semibold ${lvl?.cls}`}>
                {lvl?.label}
              </span>
              <span className="text-sm font-semibold text-sky-900">
                Score: {record.appropriateness_score}/100
              </span>
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-800">
              {record.recommendation}
            </p>
          </div>

          {/* Dati paziente */}
          <Section title="Dati paziente e contesto">
            <Row label="Codice paziente" value={record.patient_code} />
            <Row label="Età" value={`${record.patient_age} anni`} />
            <Row label="Email radiologo" value={record.radiologist_email} />
            <Row label="Durata sintomi" value={`${q.symptomsDurationWeeks} settimane`} />
            <Row label="Terapia conservativa" value={`${q.conservativeTreatmentWeeks} settimane`} />
            <Row label="Dolore non in miglioramento" value={q.painNotImproving === "si" ? "Sì" : "No"} />
          </Section>

          {/* Indicatori clinici */}
          <Section title="Indicatori clinici">
            <Row label="Trauma recente" value={q.traumaRecent === "si" ? "Sì" : "No"} />
            <Row label="Sospetta cauda equina" value={q.suspectCaudaEquina === "si" ? "Sì" : "No"} />
            <Row label="Febbre o segni infettivi" value={q.feverOrInfectionSigns === "si" ? "Sì" : "No"} />
            <Row label="Calo ponderale inspiegato" value={q.unexplainedWeightLoss === "si" ? "Sì" : "No"} />
            <Row label="Uso steroidi / osteoporosi" value={q.steroidUseOrOsteoporosis === "si" ? "Sì" : "No"} />
            <Row
              label="Deficit neurologico"
              value={NEURO_LABEL[q.neurologicalDeficit] ?? q.neurologicalDeficit}
            />
            {q.neurologicalDeficit === "entrambe" && q.neurologicalDeficitPredominance && (
              <Row
                label="Predominanza deficit"
                value={
                  q.neurologicalDeficitPredominance === "destra"
                    ? "Maggiormente a destra"
                    : q.neurologicalDeficitPredominance === "sinistra"
                      ? "Maggiormente a sinistra"
                      : "Simmetrico / uguale"
                }
              />
            )}
            <Row
              label="Irradiazione dolore"
              value={LEG_PAIN_LABEL[q.legPainReachLevel] ?? q.legPainReachLevel}
            />
          </Section>

          {/* Patologie sistemiche */}
          <Section title="Patologie sistemiche">
            {q.systemicPathologies.length === 0 ? (
              <p className="text-sm text-zinc-500">Nessuna patologia sistemica riportata.</p>
            ) : (
              <>
                <Row
                  label="Patologie"
                  value={q.systemicPathologies.map((p) => SYSTEMIC_LABEL[p] ?? p).join(", ")}
                />
                {q.systemicPathologies.map((pathology) => {
                  const detail = q.systemicPathologyDetails?.[pathology];
                  if (!detail?.trim()) return null;
                  return (
                    <Row
                      key={pathology}
                      label={`Dettaglio — ${SYSTEMIC_LABEL[pathology] ?? pathology}`}
                      value={detail}
                    />
                  );
                })}
              </>
            )}
          </Section>

          {/* Consulenze e interventi */}
          <Section title="Consulenze specialistiche e interventi pregressi">
            <Row
              label="Consulenze"
              value={
                q.specialistConsultations.length > 0
                  ? q.specialistConsultations.map((c) => CONSULTATION_LABEL[c] ?? c).join(", ")
                  : "Nessuna"
              }
            />
            {q.specialistConsultations.includes("altro") && q.specialistConsultationsOther && (
              <Row label="Altra consulenza" value={q.specialistConsultationsOther} />
            )}
            <Row label="Chirurgia lombare pregressa" value={q.priorLumbarSurgery === "si" ? "Sì" : "No"} />
            {q.priorLumbarSurgery === "si" && q.priorLumbarProcedureTypes.length > 0 && (
              <Row
                label="Tipo intervento/procedura"
                value={q.priorLumbarProcedureTypes.map((p) => PROCEDURE_LABEL[p] ?? p).join(", ")}
              />
            )}
            {q.priorLumbarSurgery === "si" &&
              q.priorLumbarProcedureTypes.includes("altro") &&
              q.priorLumbarProcedureOther && (
                <Row label="Altra procedura" value={q.priorLumbarProcedureOther} />
              )}
          </Section>

          {/* Esami precedenti */}
          <Section title="Esami precedenti">
            <Row label="Esami eseguiti" value={q.previousImagingDone === "si" ? "Sì" : "No"} />
            {q.previousImagingDone === "si" && (
              <>
                <Row
                  label="Tipologia esami"
                  value={
                    q.previousImagingTypes.length > 0
                      ? q.previousImagingTypes.map((t) => IMAGING_LABEL[t] ?? t).join(", ")
                      : "Non specificato"
                  }
                />
                {q.previousImagingTypes.includes("altro") && q.previousImagingOther && (
                  <Row label="Altro esame" value={q.previousImagingOther} />
                )}
                {q.previousImagingSummary?.trim() && (
                  <Row label="Esito sintetico" value={q.previousImagingSummary} />
                )}
              </>
            )}
          </Section>

          {/* Note */}
          {q.notes?.trim() && (
            <Section title="Note cliniche">
              <p className="text-sm text-zinc-700 leading-relaxed">{q.notes}</p>
            </Section>
          )}

          {/* Consenso */}
          <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm">
            <span
              className={`h-2 w-2 rounded-full ${q.consentDataTransmission ? "bg-green-500" : "bg-red-400"}`}
            />
            <span className="text-zinc-700">
              Consenso trasmissione dati:{" "}
              <strong>{q.consentDataTransmission ? "Acquisito" : "Non acquisito"}</strong>
            </span>
          </div>

          {/* Bottom nav */}
          <div className="flex justify-between pt-2">
            <Link
              href="/worklist"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              ← Torna alla worklist
            </Link>
            <button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800 disabled:opacity-50"
            >
              {downloadingPdf ? "Generazione..." : "Scarica PDF"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
