import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, readSessionToken } from "@/lib/auth";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!readSessionToken(token)) {
    return NextResponse.json({ error: "Non autorizzato" }, { status: 401 });
  }

  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId) || numericId <= 0) {
    return NextResponse.json({ error: "ID non valido" }, { status: 400 });
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
    .select("*")
    .eq("id", numericId)
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Record non trovato" },
      { status: 404 },
    );
  }

  return NextResponse.json(data);
}
