import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, readSessionToken } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const LEVEL_PRIORITY: Record<string, number> = {
  appropriata: 0,
  "da rivalutare": 1,
  "non appropriata": 2,
};

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!readSessionToken(token)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database non configurato" },
      { status: 503 },
    );
  }

  const { data, error } = await supabase
    .from("anamnesi_rm_lombosacrale")
    .select(
      "id, patient_code, appropriateness_level, appropriateness_score, recommendation, created_at",
    )
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: "Errore recupero dati worklist" },
      { status: 500 },
    );
  }

  const sorted = (data ?? []).sort((a, b) => {
    const levelDiff =
      (LEVEL_PRIORITY[a.appropriateness_level] ?? 9) -
      (LEVEL_PRIORITY[b.appropriateness_level] ?? 9);
    if (levelDiff !== 0) return levelDiff;
    return (b.appropriateness_score ?? 0) - (a.appropriateness_score ?? 0);
  });

  return NextResponse.json(sorted);
}
