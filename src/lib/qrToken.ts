import { SignJWT, jwtVerify } from "jose";

// The QR code on screen rotates every ROTATE_SECONDS so a photo of the
// screen (or a forwarded screenshot) stops working almost immediately.
// TOKEN_TTL_SECONDS gives a small buffer for the scan + page load itself.
export const ROTATE_SECONDS = 20;
const TOKEN_TTL_SECONDS = 35;

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set. Add it to your environment.");
  }
  return new TextEncoder().encode(secret);
}

export async function signQrToken(sessionId: string) {
  return new SignJWT({ sid: sessionId, typ: "qr" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TOKEN_TTL_SECONDS}s`)
    .sign(getSecret());
}

export async function verifyQrToken(
  token: string
): Promise<{ sessionId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    if (payload.typ !== "qr" || typeof payload.sid !== "string") return null;
    return { sessionId: payload.sid };
  } catch {
    return null;
  }
}
