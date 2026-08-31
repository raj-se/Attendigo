import { cookies } from "next/headers";

// One cookie per session remembers which student this device already
// marked present. This stops one phone from picking name after name and
// marking a whole group present. Scoped to "/" so it's sent on both the
// /attend page and the /api/attend/* routes that check it.
function cookieName(sessionId: string) {
  return `qa_marked_${sessionId}`;
}

export async function getMarkedStudentId(sessionId: string): Promise<string | null> {
  const store = await cookies();
  return store.get(cookieName(sessionId))?.value ?? null;
}

export async function setMarkedCookie(
  sessionId: string,
  studentId: string,
  sessionEndsAt: Date
) {
  const store = await cookies();
  const maxAge = Math.max(
    60,
    Math.floor((sessionEndsAt.getTime() - Date.now()) / 1000)
  );
  store.set(cookieName(sessionId), studentId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}