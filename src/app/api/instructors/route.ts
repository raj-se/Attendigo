import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getInstructorIdFromCookies, hashPassword } from "@/lib/auth";
import { createInstructorSchema } from "@/lib/validation";
import { ADMIN_EMAIL } from "@/lib/admin";
import { generateResetToken } from "@/lib/resetToken";
import { sendAccountCreatedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const instructorId = await getInstructorIdFromCookies();
  if (!instructorId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const rows = await sql`select email from instructors where id = ${instructorId}`;
  const currentEmail = rows[0]?.email;
  if (currentEmail !== ADMIN_EMAIL) {
    return NextResponse.json(
      { error: "Only the admin account can create new instructors." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createInstructorSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { name, email } = parsed.data;

  const existing = await sql`select id from instructors where email = ${email}`;
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  // Set an unusable random password now — the new instructor sets their
  // real one via the emailed reset link below, the same flow as "forgot
  // password".
  const placeholderHash = await hashPassword(randomBytes(32).toString("hex"));

  const [created] = await sql`
    insert into instructors (name, email, password_hash)
    values (${name}, ${email}, ${placeholderHash})
    returning id
  `;

  const { token, tokenHash, expiresAt } = generateResetToken();
  await sql`
    update instructors
    set reset_token_hash = ${tokenHash}, reset_token_expires_at = ${expiresAt}
    where id = ${created.id}
  `;

  const appUrl = process.env.APP_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const setPasswordUrl = `${appUrl}/reset-password/${token}`;
  await sendAccountCreatedEmail(email, setPasswordUrl).catch((err) => {
    console.error("[instructors] failed to send account-created email", err);
  });

  return NextResponse.json({ instructor: { id: created.id, name, email } }, { status: 201 });
}
