"use client";

import { useState } from "react";

export default function RequestAccessModal() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  function close() {
    setOpen(false);
    setTimeout(() => {
      setSent(false);
      setError(null);
      setName("");
      setEmail("");
      setMessage("");
    }, 200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/access-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, message }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setSent(true);
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded bg-ink px-5 py-3 text-sm font-medium text-paper hover:bg-ink-700"
      >
        Request access
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6"
          onClick={close}
        >
          <div
            className="w-full max-w-sm rounded-lg bg-paper p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            {sent ? (
              <div className="text-center">
                <p className="font-display text-lg text-ink">Request sent</p>
                <p className="mt-2 text-sm text-ink-500">
                  Thanks — we'll be in touch about setting up your account.
                </p>
                <button onClick={close} className="btn-secondary mt-5">
                  Close
                </button>
              </div>
            ) : (
              <>
                <p className="font-display text-lg text-ink">Request access</p>
                <p className="mt-1 text-sm text-ink-500">
                  Accounts are set up by the Rollcall team. Tell us a bit about
                  your classes and we'll reach out.
                </p>
                <form onSubmit={handleSubmit} className="mt-5 space-y-3">
                  <label className="block">
                    <span className="text-sm font-medium text-ink-600">Name</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      className="input mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-ink-600">Email</span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input mt-1"
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-medium text-ink-600">
                      What are you teaching? (optional)
                    </span>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      className="input mt-1"
                    />
                  </label>

                  {error && <p className="text-sm text-absent">{error}</p>}

                  <div className="flex gap-3 pt-1">
                    <button type="submit" disabled={submitting} className="btn-primary flex-1">
                      {submitting ? "Sending…" : "Send request"}
                    </button>
                    <button type="button" onClick={close} className="btn-secondary">
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
