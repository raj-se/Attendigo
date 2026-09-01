import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { forgotPasswordSchema } from "@/lib/validation";
import { generateResetToken } from "@/lib/resetToken";
import { sendPasswordResetEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// Always returns the same generic message, whether or not the email is
// registered, so this endpoint can't be used to check which emails have        
// accounts.
const GENERIC_MESSAGE =
  "If an account exists for that email, we've sent a link to reset the password.";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { email } = parsed.data;

  const rows = await sql`select id from instructors where email = ${email}`;
  const instructor = rows[0];

  if (instructor) {
    const { token, tokenHash, expiresAt } = generateResetToken();
    await sql`
      update instructors
      set reset_token_hash = ${tokenHash}, reset_token_expires_at = ${expiresAt}
      where id = ${instructor.id}
    `;
    const appUrl = process.env.APP_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
    const resetUrl = `${appUrl}/reset-password/${token}`;
    await sendPasswordResetEmail(email, resetUrl).catch((err) => {
      console.error("[forgot-password] failed to send email", err);
    });
  }

  return NextResponse.json({ message: GENERIC_MESSAGE });
}