"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type RecentEntry = {
  id: number;
  patient_code: string;
  appropriateness_level: string;
  appropriateness_score: number;
  urgency: "emergenza" | "urgente_differibile" | "da_valutare" | "non_urgente";
  created_at: string;
};

const URGENCY_BADGE: Record<string, string> = {
  emergenza: "bg-red-600 text-white",
  urgente_differibile: "bg-orange-100 text-orange-800 border border-orange-200",
  da_valutare: "bg-yellow-100 text-yellow-800 border border-yellow-200",
  non_urgente: "bg-zinc-100 text-zinc-500 border border-zinc-200",
};

const URGENCY_LABEL: Record<string, string> = {
  emergenza: "Emergenza",
  urgente_differibile: "Urgente diff.",
  da_valutare: "Da valutare",
  non_urgente: "Non urgente",
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

export default function DashboardPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/worklist")
      .then((res) => (res.ok ? res.json() : []))
      .then((data: RecentEntry[]) => setRecent(data.slice(0, 3)))
      .catch(() => setRecent([]));
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-10">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-sky-700">ScanRight</p>
          <h1 className="mt-1 text-2xl font-bold text-zinc-900">Dashboard operatore</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Seleziona il tipo di esame per avviare il questionario.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/worklist"
            className="rounded-lg border border-sky-600 bg-sky-50 px-4 py-2 text-sm font-semibold text-sky-800 hover:bg-sky-100"
          >
            Worklist radiologica
          </Link>
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-60"
          >
            {isLoggingOut ? "Uscita..." : "Logout"}
          </button>
        </div>
      </header>

      {/* Exam cards */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {/* RM Lombosacrale — active */}
        <Link
          href="/questionari/rm-lombosacrale"
          className="group rounded-2xl border-2 border-sky-200 bg-white p-6 shadow-xs hover:shadow-md hover:border-sky-400 transition-all"
        >
          <div className="flex items-start justify-between">
            <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-semibold text-sky-800">
              Attivo
            </span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-zinc-900">RM Lombosacrale</h2>
          <p className="mt-1 text-sm text-zinc-500">
            Valutazione appropriatezza per lombalgia, radicolopatia e patologia del disco.
          </p>
          <div className="mt-5 flex items-center justify-between">
            <span className="text-xs text-zinc-400">7 step · ~5 min</span>
            <span className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white group-hover:bg-sky-800 transition-colors">
              Avvia →
            </span>
          </div>
        </Link>

        {/* RM Encefalo — coming soon */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 opacity-60 cursor-not-allowed">
          <span className="inline-flex items-center rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-500">
            Prossimamente
          </span>
          <h2 className="mt-3 text-lg font-bold text-zinc-500">RM Encefalo</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Valutazione per cefalea, epilessia e patologia neurologica.
          </p>
        </div>

        {/* TC Torace — coming soon */}
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 opacity-60 cursor-not-allowed">
          <span className="inline-flex items-center rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs font-semibold text-zinc-500">
            Prossimamente
          </span>
          <h2 className="mt-3 text-lg font-bold text-zinc-500">TC Torace</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Valutazione appropriatezza per patologia polmonare e mediastinica.
          </p>
        </div>
      </div>

      {/* Recent requests */}
      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-700">Ultime richieste</h3>
          <Link href="/worklist" className="text-xs font-semibold text-sky-700 hover:underline">
            Vedi tutta la worklist →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="text-sm text-zinc-400 py-4 text-center">
            Nessuna richiesta ancora inviata.{" "}
            <Link href="/questionari/rm-lombosacrale" className="text-sky-700 hover:underline">
              Avvia il primo questionario →
            </Link>
          </p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {recent.map((entry) => (
              <div key={entry.id} className="flex items-center gap-4 py-3 text-sm">
                <span className="font-mono font-semibold text-zinc-800 w-36 shrink-0">
                  {entry.patient_code}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold shrink-0 ${URGENCY_BADGE[entry.urgency] ?? ""}`}
                >
                  {URGENCY_LABEL[entry.urgency] ?? entry.urgency}
                </span>
                <span className="text-xs text-zinc-400 shrink-0">{formatDate(entry.created_at)}</span>
                <Link
                  href={`/worklist/${entry.id}`}
                  className="ml-auto text-xs font-semibold text-sky-700 hover:underline shrink-0"
                >
                  Vedi →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
