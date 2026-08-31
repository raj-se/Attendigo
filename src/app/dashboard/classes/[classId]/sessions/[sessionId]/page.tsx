import { notFound } from "next/navigation";
import Link from "next/link";
import { getInstructorIdFromCookies } from "@/lib/auth";
import { getOwnedSession } from "@/lib/ownership";
import SessionLive from "./session-live";

export const dynamic = "force-dynamic";

export default async function SessionPage({
  params,
}: {
  params: { classId: string; sessionId: string };
}) {
  const instructorId = await getInstructorIdFromCookies();
  const session = instructorId
    ? await getOwnedSession(params.sessionId, instructorId)
    : null;
  if (!session || session.class_id !== params.classId) notFound();

  return (
    <div>
      <Link
        href={`/dashboard/classes/${params.classId}`}
        className="text-sm text-ink-500 underline underline-offset-4"
      >
        ← {session.class_name}
      </Link>
      <h1 className="mt-3 font-display text-2xl text-ink">{session.title}</h1>
      <p className="mt-1 text-sm text-ink-400">
        {new Date(session.starts_at).toLocaleString()} –{" "}
        {new Date(session.ends_at).toLocaleTimeString()} · present within{" "}
        {session.radius_meters}m
      </p>

      <SessionLive
        classId={params.classId}
        sessionId={params.sessionId}
        startsAt={session.starts_at}
        endsAt={session.ends_at}
      />
    </div>
  );
}
