import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { signupSchema } from "@/lib/validation";
import { hashPassword, createSessionToken, setSessionCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { name, email, password } = parsed.data;

  const existing = await sql`select id from instructors where email = ${email}`;
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const [instructor] = await sql`
    insert into instructors (name, email, password_hash)
    values (${name}, ${email}, ${passwordHash})
    returning id
  `;

  const token = await createSessionToken(instructor.id);
  await setSessionCookie(token);

  return NextResponse.json({ ok: true });
}
