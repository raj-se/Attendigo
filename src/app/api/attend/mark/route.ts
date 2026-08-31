import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyQrToken } from "@/lib/qrToken";
import { markAttendanceSchema } from "@/lib/validation";
import { distanceMeters } from "@/lib/geofence";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = markAttendanceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { token, studentId, latitude, longitude } = parsed.data;

  const verified = await verifyQrToken(token);
  if (!verified) {
    return NextResponse.json(
      { error: "This QR code has expired. Ask your instructor for a fresh scan." },
      { status: 410 }
    );
  }

  const rows = await sql`
    select id, class_id as "classId", latitude, longitude, radius_meters as "radiusMeters",
           starts_at as "startsAt", ends_at as "endsAt"
    from sessions where id = ${verified.sessionId}
  `;
  const session = rows[0];
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const now = new Date();
  if (now < new Date(session.startsAt) || now > new Date(session.endsAt)) {
    return NextResponse.json(
      { error: "This session is not currently accepting attendance." },
      { status: 409 }
    );
  }

  const studentRows = await sql`
    select id from students where id = ${studentId} and class_id = ${session.classId}
  `;
  if (studentRows.length === 0) {
    return NextResponse.json(
      { error: "That student isn't on this class roster." },
      { status: 404 }
    );
  }

  const existing = await sql`
    select id from attendance
    where session_id = ${session.id} and student_id = ${studentId}
  `;
  if (existing.length > 0) {
    return NextResponse.json(
      { error: "You've already been marked present for this session." },
      { status: 409 }
    );
  }

  const distance = distanceMeters(
    session.latitude,
    session.longitude,
    latitude,
    longitude
  );

  if (distance > session.radiusMeters) {
    return NextResponse.json(
      {
        error: `You're about ${Math.round(
          distance
        )}m from the room, which is outside the ${session.radiusMeters}m range for this session.`,
      },
      { status: 403 }
    );
  }

  await sql`
    insert into attendance (session_id, student_id, latitude, longitude, distance_meters)
    values (${session.id}, ${studentId}, ${latitude}, ${longitude}, ${distance})
  `;

  return NextResponse.json({ ok: true, distanceMeters: Math.round(distance) });
}
