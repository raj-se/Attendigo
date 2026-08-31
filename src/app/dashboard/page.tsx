import Link from "next/link";
import { sql } from "@/lib/db";
import { getInstructorIdFromCookies } from "@/lib/auth";
import NewClassForm from "./new-class-form";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const instructorId = await getInstructorIdFromCookies();
  const classes = await sql`
    select c.id, c.name, c.created_at as "createdAt",
      (select count(*) from students st where st.class_id = c.id)::int as "studentCount"
    from classes c
    where c.instructor_id = ${instructorId}
    order by c.created_at desc
  `;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-ink">Your classes</h1>
        <NewClassForm />
      </div>

      {classes.length === 0 ? (
        <div className="mt-10 rounded border border-dashed border-ink-200 px-6 py-14 text-center">
          <p className="font-display text-lg text-ink">No classes yet</p>
          <p className="mt-2 text-sm text-ink-500">
            Create a class, upload a roster, then start a session to get a
            projectable QR code.
          </p>
        </div>
      ) : (
        <ul className="mt-8 divide-y divide-ink-100 border-t border-ink-100">
          {classes.map((c) => (
            <li key={c.id}>
              <Link
                href={`/dashboard/classes/${c.id}`}
                className="flex items-center justify-between py-4 hover:bg-paper-dim"
              >
                <div>
                  <p className="font-display text-lg text-ink">{c.name}</p>
                  <p className="mt-1 text-xs text-ink-400">
                    {c.studentCount} {c.studentCount === 1 ? "student" : "students"} on roster
                  </p>
                </div>
                <svg width="16" height="16" viewBox="0 0 16 16" className="text-ink-300" fill="none">
                  <path d="M6 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
