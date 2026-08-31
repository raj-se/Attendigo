# Rollcall — QR-based attendance

Instructors project a rotating QR code; students scan it on their own phone
and pick their name from a pre-uploaded roster. Attendance is only marked
if the student is inside the room's radius and inside the session's time
window.

## Stack

- Next.js 14 (App Router) on Vercel
- Neon Postgres via `postgres` (postgres.js)
- Zod for validation, `jose` for signed tokens, `bcryptjs` for passwords
- `qrcode` for QR generation (server-side, as SVG)

## How the anti-proxy checks work

- **Rotating QR**: the code embeds a signed token that expires in 35s and
  the screen fetches a new one every 20s. A photo of the projected screen
  stops working almost immediately.
- **Geofencing**: each session stores a lat/lng (captured from the
  instructor's device when the session is created) and a radius in
  meters. The student's browser location is checked against it with a
  Haversine distance calculation server-side.
- **Time window**: sessions have a start and end time; scans outside that
  window are rejected.
- **One scan per student per session**: enforced with a unique constraint
  in Postgres (`unique (session_id, student_id)`).

None of this is bulletproof against a determined student with a spoofed
GPS, but it stops the common case (a friend the next room over signs in
for someone who isn't there).

## Local setup

1. **Create a Neon database** at https://neon.tech (free tier is enough
   for testing). Copy the connection string — use the "pooled connection"
   string if offered.

2. **Copy the env file and fill it in:**

   ```bash
   cp .env.example .env.local
   ```

   - `DATABASE_URL` — the Neon connection string
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `APP_URL` — `http://localhost:3000` for local dev

3. **Install dependencies and run the migration:**

   ```bash
   npm install
   npm run migrate
   ```

4. **Start the dev server:**

   ```bash
   npm run dev
   ```

   Visit `http://localhost:3000`, create an instructor account, add a
   class, paste in a roster, and start a session.

   Note: to test the geofencing/QR flow end-to-end you'll need to open
   the `/attend/<token>` link on an actual phone (or another device) so
   the browser's real GPS is used — desktop Chrome's location is usually
   accurate enough too if you allow it.

## Deploying to Vercel (for testing)

1. Push this project to a GitHub repo.
2. In Vercel, "Add New Project" → import the repo.
3. Add the same three environment variables (`DATABASE_URL`,
   `AUTH_SECRET`, `APP_URL`) in the Vercel project settings. Set
   `APP_URL` to the Vercel-assigned domain (e.g.
   `https://your-project.vercel.app`) — this is what gets embedded in
   the QR code, so it has to be the real public URL.
4. Deploy. Then run the migration once against the same `DATABASE_URL`
   from your machine:

   ```bash
   DATABASE_URL="<your neon url>" npm run migrate
   ```

5. Open the deployed URL, sign up, and try it from a real phone.

## Project structure

```
src/
  app/
    page.tsx                     landing page
    login/, signup/               instructor auth
    dashboard/                    instructor-only (protected by middleware.ts)
      classes/[classId]/          roster + sessions for a class
        sessions/[sessionId]/     projector QR view + live roster
    attend/[token]/               public scan page students land on
    api/                          all backend routes
  lib/
    db.ts          Postgres client
    auth.ts         instructor session cookie (JWT)
    qrToken.ts       short-lived rotating QR tokens
    geofence.ts      distance calculation
    ownership.ts     authorization helpers
    validation.ts    Zod schemas
migrations/001_init.sql   database schema
```

## Known limitations / next steps if this goes past testing

- Roster upload is a paste-a-list textarea, not a CSV file picker — fine
  for testing, worth upgrading if roster sizes grow.
- No password reset flow yet.
- GPS spoofing on rooted/jailbroken phones can defeat the geofence; if
  this matters for your use case, consider adding a secondary signal
  (e.g. requiring the device to be on the venue's Wi-Fi, checked via a
  local network beacon) later.
- Session "radius" is a simple circle; doesn't account for multi-floor
  buildings where a room below/above could be within the same radius.
