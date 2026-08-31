import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-paper">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="font-display text-xl font-semibold tracking-tight text-ink">
          Rollcall
        </span>
        <nav className="flex items-center gap-6 text-sm text-ink-500">
          <Link href="/login" className="hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded bg-ink px-4 py-2 text-paper hover:bg-ink-700"
          >
            Create account
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-5xl gap-12 px-6 pb-20 pt-8 md:grid-cols-2 md:items-center">
        <div>
          <h1 className="font-display text-4xl leading-[1.1] text-ink md:text-5xl">
            One student can't sign in for a whole row of empty seats anymore.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-ink-500">
            Project a QR code at the front of the room. Students scan it on
            their own phone. Rollcall checks that they're actually inside the
            room and inside the session's time window before marking them
            present — no roster to pass around, no logins to remember.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href="/signup"
              className="rounded bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-ink-700"
            >
              Start taking attendance
            </Link>
            <Link
              href="/login"
              className="text-sm font-medium text-ink underline decoration-ink-200 underline-offset-4 hover:decoration-ink"
            >
              I already have an account
            </Link>
          </div>
        </div>

        <div className="rounded-lg border border-ink-100 bg-ink p-6 shadow-sm">
          <div className="flex items-center justify-between text-paper-dim">
            <span className="font-sans text-xs text-ink-300">
              Data Structures — Section B
            </span>
            <span className="font-mono text-xs text-highlight">0:14</span>
          </div>
          <div className="mx-auto mt-5 flex aspect-square w-44 items-center justify-center rounded bg-paper">
            <svg viewBox="0 0 100 100" className="h-36 w-36 text-ink">
              <rect x="4" y="4" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="5" />
              <rect x="12" y="12" width="10" height="10" fill="currentColor" />
              <rect x="70" y="4" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="5" />
              <rect x="78" y="12" width="10" height="10" fill="currentColor" />
              <rect x="4" y="70" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="5" />
              <rect x="12" y="78" width="10" height="10" fill="currentColor" />
              <rect x="40" y="4" width="6" height="6" fill="currentColor" />
              <rect x="52" y="10" width="6" height="6" fill="currentColor" />
              <rect x="40" y="40" width="20" height="20" fill="currentColor" />
              <rect x="66" y="46" width="6" height="6" fill="currentColor" />
              <rect x="80" y="60" width="16" height="6" fill="currentColor" />
              <rect x="40" y="66" width="6" height="30" fill="currentColor" />
              <rect x="54" y="78" width="18" height="6" fill="currentColor" />
              <rect x="80" y="80" width="16" height="16" fill="currentColor" />
            </svg>
          </div>
          <p className="mt-4 text-center font-sans text-xs text-ink-300">
            Refreshes every 20 seconds — a photo of the screen stops working
            almost immediately.
          </p>
        </div>
      </section>

      <section className="border-y border-ink-100 bg-paper-dim">
        <div className="mx-auto max-w-5xl px-6 py-14">
          <h2 className="font-display text-2xl text-ink">How a session runs</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-4">
            {[
              {
                n: "1",
                t: "Start the session",
                d: "Pick a class, set how wide the room counts as \"present,\" and a time window.",
              },
              {
                n: "2",
                t: "Project the code",
                d: "Rollcall shows a QR code sized for a projector, with a countdown until it rotates.",
              },
              {
                n: "3",
                t: "Students scan",
                d: "They pick their name from the roster — no account, no app to install.",
              },
              {
                n: "4",
                t: "Location is checked",
                d: "Marked present only if they're inside the radius and inside the time window.",
              },
            ].map((step) => (
              <li key={step.n} className="border-t border-ink-200 pt-4">
                <span className="font-mono text-xs text-ink-400">{step.n}</span>
                <h3 className="mt-2 font-display text-lg text-ink">{step.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-500">
                  {step.d}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="mx-auto max-w-5xl px-6 py-10 text-xs text-ink-300">
        Built for classrooms and workshops that outgrew the paper sign-in sheet.
      </footer>
    </main>
  );
}
