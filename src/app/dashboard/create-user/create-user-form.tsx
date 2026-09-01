"use client";

import { useState } from "react";

export default function CreateUserForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<{ name: string; email: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/instructors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setCreated(data.instructor);
    setName("");
    setEmail("");
  }

  return (
    <div className="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-4">
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

        {error && (
          <p className="rounded bg-absent-bg px-3 py-2 text-sm text-absent">{error}</p>
        )}

        <button type="submit" disabled={submitting} className="btn-primary w-full">
          {submitting ? "Creating…" : "Create instructor"}
        </button>
      </form>

      {created && (
        <div className="mt-6 rounded border border-present-bg bg-present-bg px-4 py-4">
          <p className="text-sm text-present">
            Created {created.name} ({created.email}).
          </p>
          <p className="mt-1 text-xs text-ink-500">
            They've been emailed a link to set their own password. If email
            isn't configured yet, check your Vercel function logs for the
            link (search for "account is ready").
          </p>
        </div>
      )}
    </div>
  );
}
