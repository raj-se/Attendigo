"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Student = { id: string; name: string; rollNumber: string };
type Session = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  presentCount: number;
};

function toLocalInputValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
    date.getDate()
  )}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export default function ClassWorkspace({
  classId,
  initialStudents,
  initialSessions,
  studentCount,
}: {
  classId: string;
  initialStudents: Student[];
  initialSessions: Session[];
  studentCount: number;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"sessions" | "roster">(
    studentCount === 0 ? "roster" : "sessions"
  );

  return (
    <div className="mt-8">
      <div className="flex gap-6 border-b border-ink-100">
        <TabButton active={tab === "sessions"} onClick={() => setTab("sessions")}>
          Sessions
        </TabButton>
        <TabButton active={tab === "roster"} onClick={() => setTab("roster")}>
          Roster ({studentCount})
        </TabButton>
      </div>

      <div className="mt-6">
        {tab === "sessions" ? (
          <SessionsTab classId={classId} initialSessions={initialSessions} hasRoster={studentCount > 0} />
        ) : (
          <RosterTab classId={classId} initialStudents={initialStudents} onChanged={() => router.refresh()} />
        )}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 pb-3 text-sm font-medium ${
        active ? "border-ink text-ink" : "border-transparent text-ink-400 hover:text-ink-600"
      }`}
    >
      {children}
    </button>
  );
}

function RosterTab({
  classId,
  initialStudents,
  onChanged,
}: {
  classId: string;
  initialStudents: Student[];
  onChanged: () => void;
}) {
  const [students, setStudents] = useState(initialStudents);
  const [bulkText, setBulkText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  function parseRows(lines: string[]) {
    const cleaned = lines.map((line) => line.trim()).filter(Boolean);

    // If the first line looks like a header ("Name, Roll Number" etc,
    // as most spreadsheet exports include), drop it.
    if (cleaned.length > 0) {
      const first = cleaned[0].toLowerCase();
      if (first.includes("name") && (first.includes("roll") || first.includes("id"))) {
        cleaned.shift();
      }
    }

    return cleaned.map((line) => {
      const [name, rollNumber] = line.split(",").map((s) => s?.trim().replace(/^"|"$/g, ""));
      return { name, rollNumber };
    });
  }

  async function submitRows(rows: { name?: string; rollNumber?: string }[]) {
    if (rows.length === 0) {
      setError("Didn't find any rows to add.");
      return;
    }
    if (rows.some((r) => !r.name || !r.rollNumber)) {
      setError('Each row should have a name and a roll number, e.g. "Full Name, Roll Number"');
      return;
    }

    setError(null);
    setSubmitting(true);
    const res = await fetch(`/api/classes/${classId}/students`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    setStudents((prev) => {
      const byId = new Map(prev.map((s) => [s.id, s]));
      for (const s of data.students) byId.set(s.id, s);
      return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
    });
    setBulkText("");
    setFileName(null);
    onChanged();
  }

  async function handlePasteSubmit(e: React.FormEvent) {
    e.preventDefault();
    const rows = parseRows(bulkText.split("\n"));
    await submitRows(rows);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    const rows = parseRows(text.split(/\r\n|\n/));
    await submitRows(rows);
  }

  async function handleRemove(studentId: string) {
    setStudents((prev) => prev.filter((s) => s.id !== studentId));
    await fetch(`/api/classes/${classId}/students?studentId=${studentId}`, {
      method: "DELETE",
    });
    onChanged();
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      <div>
        <form onSubmit={handlePasteSubmit}>
          <label className="block text-sm font-medium text-ink-600">
            Add students
          </label>
          <p className="mt-1 text-xs text-ink-400">
            One per line: Full Name, Roll Number
          </p>
          <textarea
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
            rows={8}
            placeholder={"Asha Rao, 21IT045\nVikram Shah, 21IT046"}
            className="input mt-2 font-mono text-xs"
          />
          <button type="submit" disabled={submitting} className="btn-primary mt-3">
            {submitting ? "Adding…" : "Add to roster"}
          </button>
        </form>

        <div className="mt-5 flex items-center gap-3 border-t border-ink-100 pt-5">
          <label className="btn-secondary cursor-pointer">
            Upload CSV instead
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileChange}
              disabled={submitting}
              className="hidden"
            />
          </label>
          {fileName && <span className="text-xs text-ink-400">{fileName}</span>}
        </div>
        <p className="mt-2 text-xs text-ink-400">
          Two columns, name first: <span className="font-mono">Name,RollNumber</span>.
          A header row is fine — it's detected and skipped automatically.
        </p>

        {error && <p className="mt-2 text-xs text-absent">{error}</p>}
      </div>

      <div>
        <p className="text-sm font-medium text-ink-600">Current roster</p>
        {students.length === 0 ? (
          <p className="mt-3 text-sm text-ink-400">No students yet.</p>
        ) : (
          <ul className="mt-2 max-h-80 divide-y divide-ink-100 overflow-y-auto rounded border border-ink-100">
            {students.map((s) => (
              <li key={s.id} className="flex items-center justify-between px-3 py-2 text-sm">
                <span className="text-ink">
                  {s.name}{" "}
                  <span className="font-mono text-xs text-ink-400">{s.rollNumber}</span>
                </span>
                <button
                  onClick={() => handleRemove(s.id)}
                  className="text-xs text-ink-300 hover:text-absent"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function SessionsTab({
  classId,
  initialSessions,
  hasRoster,
}: {
  classId: string;
  initialSessions: Session[];
  hasRoster: boolean;
}) {
  const router = useRouter();
  const [sessions, setSessions] = useState(initialSessions);
  const [open, setOpen] = useState(false);

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">
          {sessions.length} session{sessions.length === 1 ? "" : "s"}
        </p>
        <button
          onClick={() => setOpen((v) => !v)}
          className="btn-primary"
          disabled={!hasRoster}
          title={hasRoster ? undefined : "Add students to the roster first"}
        >
          New session
        </button>
      </div>

      {open && (
        <NewSessionForm
          classId={classId}
          onCreated={(session) => {
            setSessions((prev) => [session, ...prev]);
            setOpen(false);
            router.refresh();
          }}
        />
      )}

      {sessions.length === 0 ? (
        <div className="mt-8 rounded border border-dashed border-ink-200 px-6 py-10 text-center text-sm text-ink-500">
          {hasRoster
            ? "No sessions yet. Start one to get a QR code you can project."
            : "Add a roster before starting your first session."}
        </div>
      ) : (
        <ul className="mt-6 divide-y divide-ink-100 border-t border-ink-100">
          {sessions.map((s) => {
            const now = new Date();
            const started = now >= new Date(s.startsAt);
            const ended = now > new Date(s.endsAt);
            const status = ended ? "Ended" : started ? "Live" : "Scheduled";
            return (
              <li key={s.id}>
                <Link
                  href={`/dashboard/classes/${classId}/sessions/${s.id}`}
                  className="flex items-center justify-between py-4 hover:bg-paper-dim"
                >
                  <div>
                    <p className="font-display text-lg text-ink">{s.title}</p>
                    <p className="mt-1 text-xs text-ink-400">
                      {new Date(s.startsAt).toLocaleString()} · {s.presentCount} present
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      status === "Live"
                        ? "bg-present-bg text-present"
                        : status === "Ended"
                        ? "bg-ink-100 text-ink-400"
                        : "bg-highlight/30 text-ink-600"
                    }`}
                  >
                    {status}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function NewSessionForm({
  classId,
  onCreated,
}: {
  classId: string;
  onCreated: (session: Session) => void;
}) {
  const now = new Date();
  const inOneHour = new Date(now.getTime() + 60 * 60 * 1000);

  const [title, setTitle] = useState("");
  const [radius, setRadius] = useState(40);
  const [startsAt, setStartsAt] = useState(toLocalInputValue(now));
  const [endsAt, setEndsAt] = useState(toLocalInputValue(inOneHour));
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function useCurrentLocation() {
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Allow location access and try again.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!coords) {
      setError("Set the room's location first.");
      return;
    }
    setSubmitting(true);
    const res = await fetch(`/api/classes/${classId}/sessions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        latitude: coords.lat,
        longitude: coords.lng,
        radiusMeters: radius,
        startsAt: new Date(startsAt).toISOString(),
        endsAt: new Date(endsAt).toISOString(),
      }),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }
    onCreated({
      id: data.session.id,
      title,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      presentCount: 0,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 rounded border border-ink-100 bg-paper-dim p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block sm:col-span-2">
          <span className="text-sm font-medium text-ink-600">Session title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Lecture 12 — Trees"
            className="input mt-1"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-600">Starts</span>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="input mt-1"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-600">Ends</span>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="input mt-1"
            required
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium text-ink-600">
            Counts as present within
          </span>
          <div className="mt-1 flex items-center gap-3">
            <input
              type="range"
              min={5}
              max={300}
              value={radius}
              onChange={(e) => setRadius(Number(e.target.value))}
              className="w-full"
            />
            <span className="w-16 shrink-0 font-mono text-sm text-ink-600">{radius}m</span>
          </div>
        </label>
        <div className="flex flex-col justify-end">
          <span className="text-sm font-medium text-ink-600">Room location</span>
          <button
            type="button"
            onClick={useCurrentLocation}
            className="btn-secondary mt-1"
            disabled={locating}
          >
            {locating ? "Locating…" : coords ? "Location set ✓" : "Use my current location"}
          </button>
        </div>
      </div>

      {error && <p className="mt-3 text-sm text-absent">{error}</p>}

      <div className="mt-4 flex gap-3">
        <button type="submit" disabled={submitting} className="btn-primary">
          {submitting ? "Starting…" : "Create session"}
        </button>
      </div>
    </form>
  );
}
