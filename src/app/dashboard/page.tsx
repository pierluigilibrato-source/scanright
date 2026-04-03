"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Modality = "radiografia" | "tac" | "rm" | "ecografia" | "moc" | "opt";

const modalities: Array<{ key: Modality; label: string }> = [
  { key: "radiografia", label: "Radiografia" },
  { key: "tac", label: "TAC" },
  { key: "rm", label: "Risonanza Magnetica (RM)" },
  { key: "ecografia", label: "Ecografia" },
  { key: "moc", label: "MOC" },
  { key: "opt", label: "OPT" },
];

export default function DashboardPage() {
  const [selectedModality, setSelectedModality] = useState<Modality | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

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
          <h1 className="text-2xl font-bold text-zinc-900">
            Dashboard operatori
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Seleziona la metodica radiologica per iniziare la raccolta anamnestica.
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

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <h2 className="text-lg font-semibold text-zinc-900">
          1) Seleziona il tipo di esame
        </h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {modalities.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedModality(item.key)}
              className={`rounded-lg border px-4 py-3 text-left text-sm transition ${
                selectedModality === item.key
                  ? "border-sky-600 bg-sky-50 text-sky-900"
                  : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <h2 className="text-lg font-semibold text-zinc-900">
          2) Seleziona l&apos;esame specifico
        </h2>

        {!selectedModality ? (
          <p className="mt-3 text-sm text-zinc-600">
            Scegli prima una metodica per visualizzare gli esami disponibili.
          </p>
        ) : null}

        {selectedModality === "rm" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Link
              href="/questionari/rm-lombosacrale"
              className="rounded-lg border border-sky-600 bg-sky-50 px-4 py-3 text-sm font-medium text-sky-900"
            >
              RM lombosacrale (attivo)
            </Link>
            <Link
              href="/esami/non-disponibile?modality=rm&exam=altro"
              className="rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-600 hover:bg-zinc-50"
            >
              Altri esami RM (in arrivo)
            </Link>
          </div>
        ) : null}

        {selectedModality && selectedModality !== "rm" ? (
          <div className="mt-4">
            <Link
              href={`/esami/non-disponibile?modality=${selectedModality}`}
              className="inline-flex rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
            >
              Vai alla pagina disponibilita questionario
            </Link>
          </div>
        ) : null}
      </section>
    </main>
  );
}
