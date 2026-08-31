import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getInstructorIdFromCookies } from "@/lib/auth";
import { getOwnedClass } from "@/lib/ownership";
import { createSessionSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { classId: string } }
) {
  const instructorId = await getInstructorIdFromCookies();
  if (!instructorId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const klass = await getOwnedClass(params.classId, instructorId);
  if (!klass) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }
  const sessions = await sql`
    select s.id, s.title, s.starts_at as "startsAt", s.ends_at as "endsAt",
      s.radius_meters as "radiusMeters",
      (select count(*) from attendance a where a.session_id = s.id)::int as "presentCount",
      (select count(*) from students st where st.class_id = s.class_id)::int as "rosterCount"
    from sessions s
    where s.class_id = ${params.classId}
    order by s.starts_at desc
  `;
  return NextResponse.json({ sessions });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { classId: string } }
) {
  const instructorId = await getInstructorIdFromCookies();
  if (!instructorId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const klass = await getOwnedClass(params.classId, instructorId);
  if (!klass) {
    return NextResponse.json({ error: "Class not found." }, { status: 404 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const { title, latitude, longitude, radiusMeters, startsAt, endsAt } = parsed.data;

  if (new Date(endsAt) <= new Date(startsAt)) {
    return NextResponse.json(
      { error: "End time must be after the start time." },
      { status: 400 }
    );
  }

  const [created] = await sql`
    insert into sessions (class_id, title, latitude, longitude, radius_meters, starts_at, ends_at)
    values (${params.classId}, ${title}, ${latitude}, ${longitude}, ${radiusMeters}, ${startsAt}, ${endsAt})
    returning id
  `;
  return NextResponse.json({ session: created }, { status: 201 });
}
