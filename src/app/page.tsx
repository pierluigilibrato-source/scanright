import Link from "next/link";

export default function HomePage() {
  return (
    <main className="relative overflow-hidden bg-zinc-50 pb-14">
      <div className="pointer-events-none absolute -top-24 left-0 h-72 w-72 rounded-full bg-cyan-200/40 blur-3xl" />
      <div className="pointer-events-none absolute right-0 top-44 h-80 w-80 rounded-full bg-sky-300/35 blur-3xl" />

      <div className="mx-auto w-full max-w-6xl px-6 pt-12">
        <section className="relative overflow-hidden rounded-[2rem] border border-cyan-100 bg-linear-to-r from-cyan-600 to-sky-700 p-8 text-white shadow-xl sm:p-10">
          <div className="pointer-events-none absolute -left-14 -top-14 h-44 w-44 rounded-full bg-white/15" />
          <div className="pointer-events-none absolute -bottom-16 right-1/4 h-48 w-48 rounded-full bg-white/10" />

          <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div>
              <span className="inline-flex rounded-full border border-white/25 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
                Piattaforma anamnestica radiologica
              </span>
              <h1 className="mt-4 text-3xl font-bold leading-tight sm:text-5xl">
                ScanRight
              </h1>
              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
                ScanRight &egrave; la piattaforma digitale progettata per
                raccogliere e organizzare i dati anamnestici in modo strutturato,
                con un flusso intuitivo e un output clinicamente utilizzabile.
              </p>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-white/90 sm:text-base">
                La finalit&agrave; &egrave; migliorare efficacia ed efficienza
                diagnostica: per il paziente, con un percorso pi&ugrave; chiaro e
                guidato; per gli operatori, con informazioni complete, coerenti e
                immediatamente disponibili.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="inline-flex items-center rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-sky-800 transition hover:bg-sky-50"
                >
                  Accedi alla piattaforma
                </Link>
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  Vai alla dashboard
                </Link>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-sm">
              <div className="rounded-3xl border border-white/25 bg-white/10 p-4 backdrop-blur">
                <div className="rounded-2xl bg-white p-4 text-zinc-800 shadow-lg">
                  <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">
                    Flusso guidato
                  </p>
                  <p className="mt-2 text-sm font-semibold">
                    Questionario anamnestico strutturato
                  </p>
                  <div className="mt-3 space-y-2">
                    {[
                      "Dati paziente e contesto clinico",
                      "Sintomi, red flags e storia medica",
                      "Report pronto per l'operatore",
                    ].map((item) => (
                      <div
                        key={item}
                        className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="absolute -right-4 -top-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-700 shadow-md">
                + Precisione
              </div>
              <div className="absolute -bottom-4 -left-4 rounded-full bg-white px-3 py-1 text-xs font-semibold text-cyan-700 shadow-md">
                + Velocit&agrave;
              </div>
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-zinc-900">Perch&eacute; ScanRight</h2>
            <p className="mt-3 text-sm leading-6 text-zinc-700">
              Un ambiente unico per standardizzare l&apos;anamnesi, ridurre
              dispersioni informative e supportare una gestione pi&ugrave; fluida del
              percorso diagnostico.
            </p>
            <ul className="mt-5 space-y-3 text-sm text-zinc-700">
              <li className="rounded-xl bg-cyan-50 px-3 py-2">
                Dati raccolti in forma chiara e confrontabile.
              </li>
              <li className="rounded-xl bg-cyan-50 px-3 py-2">
                Compilazione guidata per ridurre errori e omissioni.
              </li>
              <li className="rounded-xl bg-cyan-50 px-3 py-2">
                Operativit&agrave; pi&ugrave; rapida per il team sanitario.
              </li>
            </ul>
          </article>

          <article className="relative overflow-hidden rounded-3xl border border-sky-100 bg-linear-to-br from-sky-50 to-cyan-100 p-6 shadow-sm">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-white/60" />
            <h2 className="text-lg font-bold text-zinc-900">
              Valore per pazienti e operatori
            </h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-xs">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                  Paziente
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  Percorso comprensibile, tempi ottimizzati e maggiore chiarezza
                  nella raccolta delle informazioni cliniche.
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-xs">
                <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                  Operatore
                </p>
                <p className="mt-2 text-sm leading-6 text-zinc-700">
                  Visione pi&ugrave; completa del quadro anamnestico, con dati
                  pronti all&apos;uso per decisioni pi&ugrave; rapide.
                </p>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-sky-700 text-xs font-semibold text-white">
                SR
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-cyan-600 text-xs font-semibold text-white">
                CL
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-teal-600 text-xs font-semibold text-white">
                MD
              </span>
              <p className="ml-2 text-xs text-zinc-600">
                Team clinico allineato su una base dati condivisa.
              </p>
            </div>
          </article>
        </section>
      </div>
    </main>
  );
}
