import { NextResponse } from "next/server";

import {
  createSessionToken,
  SESSION_COOKIE_NAME,
  validateOperatorCredentials,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      username?: string;
      password?: string;
    };

    const username = body.username?.trim() ?? "";
    const password = body.password?.trim() ?? "";
    const operator = validateOperatorCredentials(username, password);

    if (!operator) {
      return NextResponse.json(
        { error: "Credenziali non valide." },
        { status: 401 },
      );
    }

    const session = createSessionToken(operator);
    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: SESSION_COOKIE_NAME,
      value: session,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 12,
    });

    return response;
  } catch {
    return NextResponse.json(
      { error: "Errore durante autenticazione." },
      { status: 500 },
    );
  }
}
