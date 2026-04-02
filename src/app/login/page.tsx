import LoginForm from "./login-form";

type LoginPageProps = {
  searchParams?: Promise<{ next?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const resolvedSearchParams = await searchParams;
  const nextPath = resolvedSearchParams?.next || "/dashboard";

  return (
    <main className="mx-auto w-full max-w-md px-6 py-16">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-xs">
        <h1 className="text-2xl font-bold text-zinc-900">Accesso operatori</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Inserisci le credenziali assegnate al personale sanitario.
        </p>
        <LoginForm nextPath={nextPath} />
      </div>
    </main>
  );
}
