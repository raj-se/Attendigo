import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getInstructorIdFromCookies } from "@/lib/auth";
import { getOwnedClass } from "@/lib/ownership";
import { z } from "zod";

export const dynamic = "force-dynamic";

const bulkSchema = z.object({
  rows: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(160),
        rollNumber: z.string().trim().min(1).max(60),
      })
    )
    .min(1, "Add at least one student")
    .max(1000),
});

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
  const students = await sql`
    select id, name, roll_number as "rollNumber"
    from students
    where class_id = ${params.classId}
    order by name asc
  `;
  return NextResponse.json({ students });
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
  const parsed = bulkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const inserted = await sql.begin(async (tx) => {
    const results = [];
    for (const row of parsed.data.rows) {
      const [r] = await tx`
        insert into students (class_id, name, roll_number)
        values (${params.classId}, ${row.name}, ${row.rollNumber})
        on conflict (class_id, roll_number) do update set name = excluded.name
        returning id, name, roll_number as "rollNumber"
      `;
      results.push(r);
    }
    return results;
  });

  return NextResponse.json({ students: inserted }, { status: 201 });
}

export async function DELETE(
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
  const { searchParams } = new URL(req.url);
  const studentId = searchParams.get("studentId");
  if (!studentId) {
    return NextResponse.json({ error: "studentId is required." }, { status: 400 });
  }
  await sql`delete from students where id = ${studentId} and class_id = ${params.classId}`;
  return NextResponse.json({ ok: true });
}
