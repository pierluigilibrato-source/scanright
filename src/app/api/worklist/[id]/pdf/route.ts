import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { SESSION_COOKIE_NAME, readSessionToken } from "@/lib/auth";
import { buildRmReportPdf } from "@/lib/report-pdf";
import { evaluateRmLombosacraleAppropriateness } from "@/lib/rm-lombosacrale-rules";
import { rmLombosacraleSchema } from "@/lib/schema";
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
  if (!id || typeof id !== "string" || id.trim().length === 0) {
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
    .select("patient_code, questionnaire_payload")
    .eq("id", id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Record non trovato" }, { status: 404 });
  }

  const parsed = rmLombosacraleSchema.safeParse(data.questionnaire_payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Payload questionario non valido" },
      { status: 422 },
    );
  }

  const result = evaluateRmLombosacraleAppropriateness(parsed.data);
  const pdfBytes = await buildRmReportPdf({ data: parsed.data, result });

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="report-rm-${data.patient_code}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
