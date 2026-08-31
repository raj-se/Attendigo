import Link from "next/link";
import { redirect } from "next/navigation";
import { getInstructorIdFromCookies } from "@/lib/auth";
import { sql } from "@/lib/db";
import SignOutButton from "./sign-out-button";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const instructorId = await getInstructorIdFromCookies();
  if (!instructorId) redirect("/login");

  const rows = await sql`select name from instructors where id = ${instructorId}`;
  const instructorName = rows[0]?.name ?? "";

  return (
    <div className="min-h-screen bg-paper">
      <header className="border-b border-ink-100">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <Link href="/dashboard" className="font-display text-lg font-semibold text-ink">
            Rollcall
          </Link>
          <div className="flex items-center gap-4 text-sm text-ink-500">
            <span>{instructorName}</span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  );
}
