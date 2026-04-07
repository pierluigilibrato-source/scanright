"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type UrgencyLevel = "emergenza" | "urgente_differibile" | "da_valutare" | "non_urgente";

type WorklistEntry = {
  id: string;
  patient_code: string;
  appropriateness_level: string;
  appropriateness_score: number;
  urgency: UrgencyLevel;
  recommendation: string;
  created_at: string;
};

const LEVEL_CONFIG: Record<
  string,
  { label: string; badgeClass: string; rowClass: string }
> = {
  appropriata: {
    label: "Appropriata",
    badgeClass: "bg-red-100 text-red-800 border border-red-200",
    rowClass: "border-l-4 border-l-red-400",
  },
  "da rivalutare": {
    label: "Da rivalutare",
    badgeClass: "bg-amber-100 text-amber-800 border border-amber-200",
    rowClass: "border-l-4 border-l-amber-400",
  },
  "non appropriata": {
    label: "Non appropriata",
    badgeClass: "bg-zinc-100 text-zinc-600 border border-zinc-200",
    rowClass: "border-l-4 border-l-zinc-300",
  },
};

const URGENCY_CONFIG: Record<
  UrgencyLevel,
  { label: string; badgeClass: string }
> = {
  emergenza: {
    label: "Emergenza",
    badgeClass: "bg-red-600 text-white",
  },
  urgente_differibile: {
    label: "Urgente differibile",
    badgeClass: "bg-orange-100 text-orange-800 border border-orange-200",
  },
  da_valutare: {
    label: "Da valutare",
    badgeClass: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  },
  non_urgente: {
    label: "Non urgente",
    badgeClass: "bg-zinc-100 text-zinc-500 border border-zinc-200",
  },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function WorklistPage() {
  const [entries, setEntries] = useState<WorklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/worklist")
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(payload.error ?? `Errore HTTP ${res.status}`);
        }
        return res.json() as Promise<WorklistEntry[]>;
      })
      .then(setEntries)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-sky-700 hover:underline"
            >
              ← Dashboard
            </Link>
            <span className="text-zinc-300">/</span>
            <span className="text-sm font-medium text-zinc-700">Worklist radiologica</span>
          </div>
          <h1 className="mt-2 text-2xl font-bold text-zinc-900">
            Worklist radiologica
          </h1>
          <p className="mt-1 text-sm text-zinc-500">
            Richieste di RM lombosacrale ordinate per appropriatezza e score clinico.
          </p>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
        >
          {isLoggingOut ? "Uscita..." : "Logout"}
        </button>
      </header>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-3">
        {Object.entries(URGENCY_CONFIG).map(([key, cfg]) => (
          <span
            key={key}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${cfg.badgeClass}`}
          >
            {cfg.label}
          </span>
        ))}
        <span className="text-xs text-zinc-400 self-center ml-1">
          — ordinamento: emergenza prima, poi score decrescente
        </span>
      </div>

      <section className="mt-4 rounded-2xl border border-zinc-200 bg-white shadow-xs overflow-hidden">
        {loading && (
          <div className="flex items-center justify-center py-16 text-sm text-zinc-500">
            Caricamento worklist...
          </div>
        )}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm font-semibold text-red-600">{error}</p>
            {error.toLowerCase().includes("configurato") && (
              <p className="text-xs text-zinc-500 max-w-sm text-center">
                Le variabili d&apos;ambiente Supabase non sono configurate su Vercel.
                Aggiungi <code className="bg-zinc-100 px-1 rounded">SUPABASE_URL</code> e{" "}
                <code className="bg-zinc-100 px-1 rounded">SUPABASE_SERVICE_ROLE_KEY</code> nelle
                impostazioni del progetto.
              </p>
            )}
          </div>
        )}

        {!loading && !error && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-sm text-zinc-500">
            <p className="font-medium">Nessuna richiesta nella worklist</p>
            <p className="mt-1 text-xs text-zinc-400">
              Le richieste compariranno dopo la compilazione di un questionario.
            </p>
            <Link
              href="/questionari/rm-lombosacrale"
              className="mt-4 rounded-lg bg-sky-700 px-4 py-2 text-xs font-semibold text-white hover:bg-sky-800"
            >
              Nuovo questionario RM lombosacrale
            </Link>
          </div>
        )}

        {!loading && !error && entries.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  <th className="px-4 py-3">Urgenza</th>
                  <th className="px-4 py-3">Appropriatezza</th>
                  <th className="px-4 py-3">Codice paziente</th>
                  <th className="px-4 py-3 text-center">Score</th>
                  <th className="px-4 py-3">Raccomandazione</th>
                  <th className="px-4 py-3">Data</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {entries.map((entry) => {
                  const levelCfg =
                    LEVEL_CONFIG[entry.appropriateness_level] ??
                    LEVEL_CONFIG["non appropriata"];
                  const urgencyCfg =
                    URGENCY_CONFIG[entry.urgency] ?? URGENCY_CONFIG["non_urgente"];
                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-zinc-50 transition-colors ${levelCfg.rowClass}`}
                    >
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${urgencyCfg.badgeClass}`}
                        >
                          {urgencyCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${levelCfg.badgeClass}`}
                        >
                          {levelCfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-semibold text-zinc-800">
                        {entry.patient_code}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-block w-10 rounded-full py-0.5 text-center text-xs font-bold ${
                            entry.appropriateness_score >= 70
                              ? "bg-red-100 text-red-700"
                              : entry.appropriateness_score >= 40
                                ? "bg-amber-100 text-amber-700"
                                : "bg-zinc-100 text-zinc-600"
                          }`}
                        >
                          {entry.appropriateness_score}
                        </span>
                      </td>
                      <td className="max-w-xs px-4 py-3 text-xs text-zinc-600">
                        <span className="line-clamp-2">{entry.recommendation}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-zinc-500 whitespace-nowrap">
                        {formatDate(entry.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/worklist/${entry.id}`}
                          className="rounded-lg bg-sky-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-sky-800 whitespace-nowrap"
                        >
                          Vedi report
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="mt-4 text-center text-xs text-zinc-400">
        {entries.length > 0 && `${entries.length} richiesta${entries.length !== 1 ? " totali" : " totale"}`}
      </p>
    </main>
  );
}
