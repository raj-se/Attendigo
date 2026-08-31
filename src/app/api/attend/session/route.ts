import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyQrToken } from "@/lib/qrToken";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const verified = await verifyQrToken(token);
  if (!verified) {
    return NextResponse.json(
      { error: "This QR code has expired. Ask your instructor for a fresh scan." },
      { status: 410 }
    );
  }

  const rows = await sql`
    select s.id, s.title, s.starts_at as "startsAt", s.ends_at as "endsAt", c.name as "className", s.class_id as "classId"
    from sessions s
    join classes c on c.id = s.class_id
    where s.id = ${verified.sessionId}
  `;
  const session = rows[0];
  if (!session) {
    return NextResponse.json({ error: "Session not found." }, { status: 404 });
  }

  const now = new Date();
  if (now < new Date(session.startsAt)) {
    return NextResponse.json(
      { error: "This session hasn't started yet." },
      { status: 409 }
    );
  }
  if (now > new Date(session.endsAt)) {
    return NextResponse.json(
      { error: "This session has ended." },
      { status: 409 }
    );
  }

  const students = await sql`
    select id, name, roll_number as "rollNumber"
    from students
    where class_id = ${session.classId}
    order by name asc
  `;

  return NextResponse.json({
    sessionTitle: session.title,
    className: session.className,
    students,
  });
}
