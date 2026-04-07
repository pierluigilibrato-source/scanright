import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, readSessionToken } from "@/lib/auth";
import type { UrgencyLevel } from "@/lib/rm-lombosacrale-rules";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

const LEVEL_PRIORITY: Record<string, number> = {
  appropriata: 0,
  "da rivalutare": 1,
  "non appropriata": 2,
};

function deriveUrgency(level: string, score: number): UrgencyLevel {
  if (score >= 95) return "emergenza";
  if (level === "appropriata") return "urgente_differibile";
  if (level === "da rivalutare") return "da_valutare";
  return "non_urgente";
}

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

  const URGENCY_PRIORITY: Record<UrgencyLevel, number> = {
    emergenza: 0,
    urgente_differibile: 1,
    da_valutare: 2,
    non_urgente: 3,
  };

  const withUrgency = (data ?? []).map((row) => ({
    ...row,
    urgency: deriveUrgency(row.appropriateness_level, row.appropriateness_score ?? 0),
  }));

  const sorted = withUrgency.sort((a, b) => {
    const urgencyDiff = URGENCY_PRIORITY[a.urgency] - URGENCY_PRIORITY[b.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    return (b.appropriateness_score ?? 0) - (a.appropriateness_score ?? 0);
  });

  return NextResponse.json(sorted);
}
