import { NextResponse } from "next/server";

import { buildRmReportPdf } from "@/lib/report-pdf";
import { evaluateRmLombosacraleAppropriateness } from "@/lib/rm-lombosacrale-rules";
import { rmLombosacraleSchema } from "@/lib/schema";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = rmLombosacraleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Dati anamnestici non validi",
          details: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const data = parsed.data;
    const result = evaluateRmLombosacraleAppropriateness(data);
    const pdfBytes = await buildRmReportPdf({ data, result });

    const supabase = getSupabaseServerClient();
    if (supabase) {
      await supabase.from("anamnesi_rm_lombosacrale").insert({
        patient_code: data.patientCode,
        patient_age: data.patientAge,
        radiologist_email: data.radiologistEmail,
        questionnaire_payload: data,
        appropriateness_level: result.level,
        appropriateness_score: result.score,
        recommendation: result.recommendation,
      });
    }

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-rm-lombosacrale-${data.patientCode}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Errore interno durante la generazione del report PDF" },
      { status: 500 },
    );
  }
}
