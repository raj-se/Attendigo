import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { getInstructorIdFromCookies } from "@/lib/auth";
import { getOwnedSession } from "@/lib/ownership";
import { signQrToken, ROTATE_SECONDS } from "@/lib/qrToken";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const instructorId = await getInstructorIdFromCookies();
  if (!instructorId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const session = await getOwnedSession(params.sessionId, instructorId);
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const now = new Date();
  if (now < new Date(session.starts_at) || now > new Date(session.ends_at)) {
    return NextResponse.json({
      active: false,
      reason:
        now < new Date(session.starts_at)
          ? "This session hasn't started yet."
          : "This session has ended.",
    });
  }

  const token = await signQrToken(session.id);
  const appUrl = process.env.APP_URL ?? `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const attendUrl = `${appUrl}/attend/${token}`;
  const qrSvg = await QRCode.toString(attendUrl, { type: "svg", margin: 1, width: 320 });

  return NextResponse.json({
    active: true,
    qrSvg,
    rotateInSeconds: ROTATE_SECONDS,
  });
}
