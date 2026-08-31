import { notFound } from "next/navigation";
import Link from "next/link";
import { getInstructorIdFromCookies } from "@/lib/auth";
import { getOwnedClass } from "@/lib/ownership";
import { sql } from "@/lib/db";
import ClassWorkspace from "./class-workspace";

export const dynamic = "force-dynamic";

export default async function ClassPage({
  params,
}: {
  params: { classId: string };
}) {
  const instructorId = await getInstructorIdFromCookies();
  const klass = instructorId ? await getOwnedClass(params.classId, instructorId) : null;
  if (!klass) notFound();

  const students = await sql`
    select id, name, roll_number as "rollNumber"
    from students where class_id = ${params.classId}
    order by name asc
  `;

  const sessions = await sql`
    select id, title, starts_at as "startsAt", ends_at as "endsAt",
      (select count(*) from attendance a where a.session_id = sessions.id)::int as "presentCount"
    from sessions
    where class_id = ${params.classId}
    order by starts_at desc
  `;

  return (
    <div>
      <Link href="/dashboard" className="text-sm text-ink-500 underline underline-offset-4">
        ← All classes
      </Link>
      <h1 className="mt-3 font-display text-2xl text-ink">{klass.name}</h1>

      <ClassWorkspace
        classId={params.classId}
        initialStudents={students as unknown as { id: string; name: string; rollNumber: string }[]}
        initialSessions={
          sessions as unknown as {
            id: string;
            title: string;
            startsAt: string;
            endsAt: string;
            presentCount: number;
          }[]
        }
        studentCount={students.length}
      />
    </div>
  );
}
