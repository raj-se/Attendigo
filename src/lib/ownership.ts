import { sql } from "@/lib/db";

export async function getOwnedClass(classId: string, instructorId: string) {
  const rows = await sql`
    select id, name from classes
    where id = ${classId} and instructor_id = ${instructorId}
  `;
  return rows[0] ?? null;
}

export async function getOwnedSession(sessionId: string, instructorId: string) {
  const rows = await sql`
    select s.id, s.class_id, s.title, s.latitude, s.longitude,
           s.radius_meters, s.starts_at, s.ends_at, c.name as class_name
    from sessions s
    join classes c on c.id = s.class_id
    where s.id = ${sessionId} and c.instructor_id = ${instructorId}
  `;
  return rows[0] ?? null;
}
