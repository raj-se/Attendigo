import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { loginSchema } from "@/lib/validation";
import { verifyPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email, password } = parsed.data;

  const rows = await sql`
    select id, password_hash from instructors where email = ${email}
  `;
  const instructor = rows[0];
  if (!instructor) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 }
    );
  }

  const valid = await verifyPassword(password, instructor.password_hash);
  if (!valid) {
    return NextResponse.json(
      { error: "Incorrect email or password." },
      { status: 401 }
    );
  }

  const token = await createSessionToken(instructor.id);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
