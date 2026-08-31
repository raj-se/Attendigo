import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getInstructorIdFromCookies } from "@/lib/auth";
import { createClassSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

export async function GET() {
  const instructorId = await getInstructorIdFromCookies();
  if (!instructorId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const classes = await sql`
    select c.id, c.name, c.created_at,
      (select count(*) from students st where st.class_id = c.id)::int as student_count
    from classes c
    where c.instructor_id = ${instructorId}
    order by c.created_at desc
  `;
  return NextResponse.json({ classes });
}

export async function POST(req: NextRequest) {
  const instructorId = await getInstructorIdFromCookies();
  if (!instructorId) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }
  const body = await req.json().catch(() => null);
  const parsed = createClassSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  const [created] = await sql`
    insert into classes (instructor_id, name)
    values (${instructorId}, ${parsed.data.name})
    returning id, name, created_at
  `;
  return NextResponse.json({ class: created }, { status: 201 });
}
