import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getInstructorIdFromCookies } from "@/lib/auth";
import { getOwnedSession } from "@/lib/ownership";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
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

  const roster = await sql`
    select
      st.id,
      st.name,
      st.roll_number as "rollNumber",
      a.marked_at as "markedAt",
      a.distance_meters as "distanceMeters"
    from students st
    left join attendance a
      on a.student_id = st.id and a.session_id = ${params.sessionId}
    where st.class_id = ${session.class_id}
    order by (a.marked_at is null) asc, st.name asc
  `;

  const presentCount = roster.filter((r) => r.markedAt).length;

  return NextResponse.json({ roster, presentCount, totalCount: roster.length });
}
