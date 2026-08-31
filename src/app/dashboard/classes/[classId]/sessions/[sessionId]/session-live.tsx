"use client";

import { useEffect, useRef, useState } from "react";

type RosterRow = {
  id: string;
  name: string;
  rollNumber: string;
  markedAt: string | null;
  distanceMeters: number | null;
};

export default function SessionLive({
  sessionId,
  startsAt,
  endsAt,
}: {
  classId: string;
  sessionId: string;
  startsAt: string;
  endsAt: string;
}) {
  const [tab, setTab] = useState<"present" | "roster">("present");

  return (
    <div className="mt-8">
      <div className="flex gap-6 border-b border-ink-100">
        <TabButton active={tab === "present"} onClick={() => setTab("present")}>
          Present the code
        </TabButton>
        <TabButton active={tab === "roster"} onClick={() => setTab("roster")}>
          Live roster
        </TabButton>
      </div>

      <div className="mt-6">
        {tab === "present" ? (
          <ProjectorPanel sessionId={sessionId} startsAt={startsAt} endsAt={endsAt} />
        ) : (
          <RosterPanel sessionId={sessionId} />
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

function ProjectorPanel({
  sessionId,
  startsAt,
  endsAt,
}: {
  sessionId: string;
  startsAt: string;
  endsAt: string;
}) {
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [inactiveReason, setInactiveReason] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    let rotateTimer: ReturnType<typeof setTimeout>;
    let tickTimer: ReturnType<typeof setInterval>;

    async function fetchCode() {
      const res = await fetch(`/api/sessions/${sessionId}/qr`, { cache: "no-store" });
      const data = await res.json();
      if (cancelled) return;

      if (!data.active) {
        setInactiveReason(data.reason);
        setQrSvg(null);
        return;
      }
      setInactiveReason(null);
      setQrSvg(data.qrSvg);
      let remaining = data.rotateInSeconds as number;
      setCountdown(remaining);
      clearInterval(tickTimer);
      tickTimer = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) clearInterval(tickTimer);
      }, 1000);
      rotateTimer = setTimeout(fetchCode, remaining * 1000);
    }

    fetchCode();
    return () => {
      cancelled = true;
      clearTimeout(rotateTimer);
      clearInterval(tickTimer);
    };
  }, [sessionId]);

  function toggleFullscreen() {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="flex flex-col items-center justify-center rounded-lg bg-ink px-6 py-16 text-center"
      >
        {inactiveReason ? (
          <p className="max-w-sm font-display text-xl text-paper">{inactiveReason}</p>
        ) : qrSvg ? (
          <>
            <div
              className="rounded bg-paper p-6"
              dangerouslySetInnerHTML={{ __html: qrSvg }}
            />
            <p className="mt-6 font-mono text-sm text-highlight">
              refreshes in {countdown ?? "…"}s
            </p>
            <p className="mt-1 text-xs text-ink-300">
              {new Date(startsAt).toLocaleTimeString()} – {new Date(endsAt).toLocaleTimeString()}
            </p>
          </>
        ) : (
          <p className="text-paper-dim">Loading…</p>
        )}
      </div>
      <button onClick={toggleFullscreen} className="btn-secondary mt-4">
        Toggle full screen for projecting
      </button>
    </div>
  );
}

function RosterPanel({ sessionId }: { sessionId: string }) {
  const [roster, setRoster] = useState<RosterRow[] | null>(null);
  const [presentCount, setPresentCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const res = await fetch(`/api/sessions/${sessionId}/attendance`, { cache: "no-store" });
      const data = await res.json();
      if (cancelled) return;
      setRoster(data.roster);
      setPresentCount(data.presentCount);
    }
    load();
    const interval = setInterval(load, 4000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [sessionId]);

  if (!roster) {
    return <p className="text-sm text-ink-400">Loading…</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-600">
          <span className="font-medium text-present">{presentCount}</span> of {roster.length} present
        </p>
        <a href={`/api/sessions/${sessionId}/export`} className="btn-secondary">
          Export CSV
        </a>
      </div>

      <ul className="mt-4 divide-y divide-ink-100 border-t border-ink-100">
        {roster.map((r) => (
          <li key={r.id} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm text-ink">{r.name}</p>
              <p className="font-mono text-xs text-ink-400">{r.rollNumber}</p>
            </div>
            {r.markedAt ? (
              <span className="rounded bg-present-bg px-2 py-1 text-xs font-medium text-present">
                Present · {new Date(r.markedAt).toLocaleTimeString()}
              </span>
            ) : (
              <span className="rounded bg-absent-bg px-2 py-1 text-xs font-medium text-absent">
                Absent
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
