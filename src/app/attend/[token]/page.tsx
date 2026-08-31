"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

type Student = { id: string; name: string; rollNumber: string };

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; sessionTitle: string; className: string; students: Student[] };

type SubmitState =
  | { status: "idle" }
  | { status: "locating" }
  | { status: "submitting" }
  | { status: "success"; distanceMeters: number }
  | { status: "error"; message: string };

export default function AttendPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;

  const [load, setLoad] = useState<LoadState>({ status: "loading" });
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Student | null>(null);
  const [submit, setSubmit] = useState<SubmitState>({ status: "idle" });

  useEffect(() => {
    let cancelled = false;
    async function run() {
      const res = await fetch(`/api/attend/session?token=${encodeURIComponent(token)}`, {
        cache: "no-store",
      });
      const data = await res.json();
      if (cancelled) return;
      if (!res.ok) {
        setLoad({ status: "error", message: data.error ?? "This link isn't valid." });
        return;
      }
      setLoad({
        status: "ready",
        sessionTitle: data.sessionTitle,
        className: data.className,
        students: data.students,
      });
    }
    run();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const filtered = useMemo(() => {
    if (load.status !== "ready") return [];
    const q = query.trim().toLowerCase();
    if (!q) return load.students.slice(0, 8);
    return load.students
      .filter(
        (s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q)
      )
      .slice(0, 8);
  }, [load, query]);

  function markPresent() {
    if (!selected) return;
    setSubmit({ status: "locating" });
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setSubmit({ status: "submitting" });
        const res = await fetch("/api/attend/mark", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            studentId: selected.id,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSubmit({ status: "error", message: data.error ?? "Something went wrong." });
          return;
        }
        setSubmit({ status: "success", distanceMeters: data.distanceMeters });
      },
      () => {
        setSubmit({
          status: "error",
          message:
            "Location access is required to mark attendance. Allow it in your browser and try again.",
        });
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6 py-10">
      <div className="w-full max-w-sm">
        <p className="font-display text-lg font-semibold text-ink">Rollcall</p>

        {load.status === "loading" && (
          <p className="mt-6 text-sm text-ink-400">Loading session…</p>
        )}

        {load.status === "error" && (
          <div className="mt-6 rounded border border-absent-bg bg-absent-bg px-4 py-4">
            <p className="text-sm text-absent">{load.message}</p>
          </div>
        )}

        {load.status === "ready" && submit.status !== "success" && (
          <div className="mt-6">
            <h1 className="font-display text-xl text-ink">{load.sessionTitle}</h1>
            <p className="mt-1 text-sm text-ink-500">{load.className}</p>

            {!selected ? (
              <div className="mt-6">
                <label className="text-sm font-medium text-ink-600">Find your name</label>
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Start typing your name or roll number"
                  className="input mt-1"
                />
                <ul className="mt-3 divide-y divide-ink-100 rounded border border-ink-100">
                  {filtered.length === 0 ? (
                    <li className="px-3 py-3 text-sm text-ink-400">No matches.</li>
                  ) : (
                    filtered.map((s) => (
                      <li key={s.id}>
                        <button
                          onClick={() => setSelected(s)}
                          className="flex w-full items-center justify-between px-3 py-3 text-left text-sm hover:bg-paper-dim"
                        >
                          <span className="text-ink">{s.name}</span>
                          <span className="font-mono text-xs text-ink-400">{s.rollNumber}</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : (
              <div className="mt-6">
                <div className="rounded border border-ink-100 bg-paper-dim px-4 py-4">
                  <p className="text-sm text-ink-500">Marking present as</p>
                  <p className="mt-1 font-display text-lg text-ink">{selected.name}</p>
                  <p className="font-mono text-xs text-ink-400">{selected.rollNumber}</p>
                </div>

                {submit.status === "error" && (
                  <p className="mt-3 text-sm text-absent">{submit.message}</p>
                )}

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={markPresent}
                    disabled={submit.status === "locating" || submit.status === "submitting"}
                    className="btn-primary flex-1"
                  >
                    {submit.status === "locating"
                      ? "Checking your location…"
                      : submit.status === "submitting"
                      ? "Marking present…"
                      : "That's me — mark me present"}
                  </button>
                </div>
                <button
                  onClick={() => {
                    setSelected(null);
                    setSubmit({ status: "idle" });
                  }}
                  className="mt-3 text-sm text-ink-400 underline underline-offset-4"
                >
                  Not you? Pick a different name
                </button>
              </div>
            )}
          </div>
        )}

        {submit.status === "success" && (
          <div className="mt-6 rounded border border-present-bg bg-present-bg px-4 py-6 text-center">
            <p className="font-display text-xl text-present">You're marked present</p>
            <p className="mt-2 text-sm text-ink-500">
              Confirmed from about {submit.distanceMeters}m away.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
