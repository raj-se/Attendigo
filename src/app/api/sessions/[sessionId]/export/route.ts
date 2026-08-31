import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getInstructorIdFromCookies } from "@/lib/auth";
import { getOwnedSession } from "@/lib/ownership";

export const dynamic = "force-dynamic";

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

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
      st.name,
      st.roll_number as "rollNumber",
      a.marked_at as "markedAt",
      round(a.distance_meters::numeric, 1) as "distanceMeters"
    from students st
    left join attendance a
      on a.student_id = st.id and a.session_id = ${params.sessionId}
    where st.class_id = ${session.class_id}
    order by st.name asc
  `;

  const header = ["Name", "Roll number", "Status", "Marked at", "Distance (m)"];
  const lines = [header.join(",")];
  for (const r of roster) {
    lines.push(
      [
        csvEscape(r.name),
        csvEscape(r.rollNumber),
        r.markedAt ? "Present" : "Absent",
        r.markedAt ? new Date(r.markedAt).toISOString() : "",
        r.distanceMeters ?? "",
      ].join(",")
    );
  }

  const csv = lines.join("\n");
  const filename = `${session.title.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}-attendance.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
