import { notFound } from "next/navigation";
import { getInstructorIdFromCookies } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ADMIN_EMAIL } from "@/lib/admin";
import CreateUserForm from "./create-user-form";

export const dynamic = "force-dynamic";

export default async function CreateUserPage() {
  const instructorId = await getInstructorIdFromCookies();
  const rows = instructorId
    ? await sql`select email from instructors where id = ${instructorId}`
    : [];
  const email = rows[0]?.email;

  if (email !== ADMIN_EMAIL) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-ink">Create instructor</h1>
      <p className="mt-1 text-sm text-ink-500">
        Only visible to the admin account.
      </p>
      <div className="mt-8">
        <CreateUserForm />
      </div>
    </div>
  );
}
