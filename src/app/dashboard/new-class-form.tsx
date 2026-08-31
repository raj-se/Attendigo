"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NewClassForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const res = await fetch("/api/classes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setName("");
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        New class
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3">
      <div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Data Structures — Section B"
          className="input w-72"
          autoFocus
          required
        />
        {error && <p className="mt-1 text-xs text-absent">{error}</p>}
      </div>
      <button type="submit" disabled={submitting} className="btn-primary">
        {submitting ? "Creating…" : "Create"}
      </button>
      <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
        Cancel
      </button>
    </form>
  );
}
