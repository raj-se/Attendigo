import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { resetPasswordSchema } from "@/lib/validation";
import { hashResetToken } from "@/lib/resetToken";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { token, password } = parsed.data;
  const tokenHash = hashResetToken(token);

  const rows = await sql`
    select id from instructors
    where reset_token_hash = ${tokenHash}
      and reset_token_expires_at > now()
  `;
  const instructor = rows[0];
  if (!instructor) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired. Request a new one." },
      { status: 410 }
    );
  }

  const passwordHash = await hashPassword(password);
  await sql`
    update instructors
    set password_hash = ${passwordHash},
        reset_token_hash = null,
        reset_token_expires_at = null
    where id = ${instructor.id}
  `;

  const sessionToken = await createSessionToken(instructor.id);
  await setSessionCookie(sessionToken);

  return NextResponse.json({ ok: true });
}