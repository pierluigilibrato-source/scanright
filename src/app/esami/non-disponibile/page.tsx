import Link from "next/link";

const modalityLabel: Record<string, string> = {
  radiografia: "Radiografia",
  tac: "TAC",
  rm: "Risonanza Magnetica",
  ecografia: "Ecografia",
  moc: "MOC",
  opt: "OPT",
};

type ExamNotAvailablePageProps = {
  searchParams?: Promise<{ modality?: string }>;
};

export default async function ExamNotAvailablePage({
  searchParams,
}: ExamNotAvailablePageProps) {
  const resolvedSearchParams = await searchParams;
  const modality = resolvedSearchParams?.modality || "";
  const modalityText = modalityLabel[modality] || "Esame selezionato";

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-14">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-zinc-900">Questionario in sviluppo</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-700">
          Per la metodica <strong>{modalityText}</strong> il questionario non e ancora
          disponibile in fase test. Attualmente la piattaforma valida il flusso sul
          questionario <strong>RM lombosacrale</strong>.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-700 hover:bg-zinc-50"
          >
            Torna alla dashboard
          </Link>
          <Link
            href="/questionari/rm-lombosacrale"
            className="rounded-lg bg-sky-700 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-800"
          >
            Apri questionario RM lombosacrale
          </Link>
        </div>
      </section>
    </main>
  );
}
