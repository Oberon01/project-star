"use client";

import { useEffect, useState } from "react";

type OracleEntry = {
  signal: string;
  friction: string;
  alignment: string;
};

const EMPTY_ENTRY: OracleEntry = {
  signal: "",
  friction: "",
  alignment: "",
};

const STORAGE_PREFIX = "solaces.oracle.daily";

function getTodayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function formatDateLabel(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function storageKeyFor(dateKey: string) {
  return `${STORAGE_PREFIX}:${dateKey}`;
}

export default function OraclePage() {
  const [currentKey, setCurrentKey] = useState(getTodayKey);
  const [entry, setEntry] = useState<OracleEntry>(EMPTY_ENTRY);

  // Load entry when date changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    const raw = window.localStorage.getItem(storageKeyFor(currentKey));
    if (!raw) {
      setEntry(EMPTY_ENTRY);
      return;
    }
    try {
      const parsed = JSON.parse(raw) as OracleEntry;
      setEntry({
        signal: parsed.signal ?? "",
        friction: parsed.friction ?? "",
        alignment: parsed.alignment ?? "",
      });
    } catch {
      setEntry(EMPTY_ENTRY);
    }
  }, [currentKey]);

  const isToday = currentKey === getTodayKey();

  // Update helpers: update state + immediately write to localStorage
  const updateField = (field: keyof OracleEntry, value: string) => {
    setEntry((prev) => {
      const next = { ...prev, [field]: value };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(
          storageKeyFor(currentKey),
          JSON.stringify(next)
        );
      }
      return next;
    });
  };

  const changeDay = (delta: number) => {
    const [y, m, d] = currentKey.split("-").map(Number);
    const date = new Date(y, (m ?? 1) - 1, d ?? 1);
    date.setDate(date.getDate() + delta);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    setCurrentKey(`${yyyy}-${mm}-${dd}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Oracle Mirror
            </p>
            <p className="text-sm text-slate-300">
              Quiet daily reflection. Observe, don&apos;t judge.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <button
              onClick={() => changeDay(-1)}
              className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
            >
              ← Prev
            </button>
            <span className="font-mono text-slate-200">
              {formatDateLabel(currentKey)}
              {isToday && <span className="text-slate-500"> · Today</span>}
            </span>
            <button
              onClick={() => setCurrentKey(getTodayKey())}
              className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
            >
              Today
            </button>
            <button
              onClick={() => changeDay(1)}
              className="rounded-md border border-slate-700 px-2 py-1 hover:bg-slate-800"
            >
              Next →
            </button>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Signal */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
            Signal
          </p>
          <p className="text-xs text-slate-400 mb-2">
            What stood out today? Moments, patterns, or small hints that felt
            meaningful.
          </p>
          <textarea
            value={entry.signal}
            onChange={(e) => updateField("signal", e.target.value)}
            rows={6}
            className="mt-auto w-full bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
            placeholder="- A conversation that lingered\n- A pattern you noticed\n- Something that felt like a quiet nudge"
          />
        </div>

        {/* Friction */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
            Friction
          </p>
          <p className="text-xs text-slate-400 mb-2">
            Where did things drag or grate? Energy drains, resistance, or
            misalignment.
          </p>
          <textarea
            value={entry.friction}
            onChange={(e) => updateField("friction", e.target.value)}
            rows={6}
            className="mt-auto w-full bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
            placeholder="- Tasks that felt heavier than they should\n- Social friction\n- Any &quot;this doesn&apos;t feel right&quot; moments"
          />
        </div>

        {/* Alignment */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
            Alignment
          </p>
          <p className="text-xs text-slate-400 mb-2">
            Where did you feel most like yourself? Calm, clear, or quietly
            certain.
          </p>
          <textarea
            value={entry.alignment}
            onChange={(e) => updateField("alignment", e.target.value)}
            rows={6}
            className="mt-auto w-full bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
            placeholder="- Work that felt natural\n- Moments of stillness\n- Choices that felt clean and simple"
          />
        </div>
      </section>
    </div>
  );
}
