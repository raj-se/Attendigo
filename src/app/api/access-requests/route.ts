import { NextRequest, NextResponse } from "next/server";
import { accessRequestSchema } from "@/lib/validation";
import { sendAccessRequestEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = accessRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  try {
    await sendAccessRequestEmail(parsed.data);
  } catch (err) {
    console.error("[access-requests] failed to send notification email", err);
    return NextResponse.json(
      { error: "Something went wrong sending your request. Try again in a bit." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
