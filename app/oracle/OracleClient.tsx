"use client";

import { useEffect, useState, useMemo } from "react";

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

function dateToKey(date: Date) {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getTodayKey() {
  return dateToKey(new Date());
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

/** --- Oracle “tone” layer --- **/
const STILLNESS_PROMPTS = [
  "What did stillness reveal today that motion would have blurred out of view?",
  "Where did you choose comprehension over control?",
  "Which question has quietly repeated itself in the back of your mind?",
  "What tension is asking to be observed, not solved?",
  "Where could you subtract instead of add?",
];

function getDailyPrompt() {
  const today = new Date();
  const index =
    (today.getFullYear() +
      today.getMonth() +
      today.getDate()) % STILLNESS_PROMPTS.length;
  return STILLNESS_PROMPTS[index];
}

function getDailyPassage() {
  return (
    "To see clearly is to move slowly. The world will try to hurry you into " +
    "choices that aren’t yours. Pause until the shape of things becomes simple again."
  );
}

type TimelineEntry = {
  dateKey: string;
  entry: OracleEntry;
};

function hasContent(entry: OracleEntry) {
  return (
    entry.signal.trim().length > 0 ||
    entry.friction.trim().length > 0 ||
    entry.alignment.trim().length > 0
  );
}

export default function OracleClient() {
  const [currentKey, setCurrentKey] = useState(getTodayKey);
  const [entry, setEntry] = useState<OracleEntry>(EMPTY_ENTRY);
  const [recentEntries, setRecentEntries] = useState<TimelineEntry[]>([]);

  // Derived daily tone
  const dailyPrompt = useMemo(() => getDailyPrompt(), []);
  const dailyPassage = useMemo(() => getDailyPassage(), []);

  const isToday = currentKey === getTodayKey();

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

  // Build last 7 days timeline (including today) from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    const today = new Date();
    const result: TimelineEntry[] = [];

    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateKey = dateToKey(d);
      const raw = window.localStorage.getItem(storageKeyFor(dateKey));
      if (!raw) continue;

      try {
        const parsed = JSON.parse(raw) as OracleEntry;
        const normalized: OracleEntry = {
          signal: parsed.signal ?? "",
          friction: parsed.friction ?? "",
          alignment: parsed.alignment ?? "",
        };
        if (hasContent(normalized)) {
          result.push({ dateKey, entry: normalized });
        }
      } catch {
        // ignore malformed entries
      }
    }

    setRecentEntries(result);
  }, [currentKey, entry.signal, entry.friction, entry.alignment]);

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
    setCurrentKey(dateToKey(date));
  };

  return (
    <div className="space-y-6">
      {/* Header + Date Controls */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Oracle · Mirror
            </p>
            <p className="text-sm text-slate-300">
              Quiet daily reflection. Observe, don&apos;t judge.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
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

      {/* Daily Passage + Prompt */}
      <section className="grid gap-4 md:grid-cols-5">
        {/* Passage */}
        <div className="md:col-span-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 h-full flex flex-col">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
              Today&apos;s Passage
            </p>
            <p className="text-sm text-slate-200 leading-relaxed">
              {dailyPassage}
            </p>
            <p className="mt-3 text-[0.7rem] text-slate-500">
              Read it once. Then once more, slower.
            </p>
          </div>
        </div>

        {/* Prompt */}
        <div className="md:col-span-2">
          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 h-full flex flex-col justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
                Stillness Prompt
              </p>
              <p className="text-sm text-slate-200 leading-relaxed">
                {dailyPrompt}
              </p>
            </div>
            <p className="mt-3 text-[0.7rem] text-slate-500">
              You don&apos;t have to answer. Let the question move around your
              day on its own.
            </p>
          </div>
        </div>
      </section>

      {/* Signal / Friction / Alignment Cards */}
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

      {/* Last 7 Days Timeline */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 sm:px-5 sm:py-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Last 7 Days
            </p>
            <p className="text-xs text-slate-400">
              A quick glance at recent echoes. Only days with notes are shown.
            </p>
          </div>
        </div>

        {recentEntries.length === 0 ? (
          <p className="text-xs text-slate-500">
            No entries yet in the last 7 days. Today is a good place to start.
          </p>
        ) : (
          <div className="space-y-2">
            {recentEntries.map(({ dateKey, entry }) => (
              <article
                key={dateKey}
                className="flex flex-col sm:flex-row sm:items-start gap-3 rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-3"
              >
                <div className="sm:w-40">
                  <p className="text-xs font-mono text-slate-300">
                    {formatDateLabel(dateKey)}
                  </p>
                  {dateKey === getTodayKey() && (
                    <p className="text-[0.65rem] text-emerald-400 mt-0.5">
                      Today
                    </p>
                  )}
                </div>
                <div className="flex-1 text-xs text-slate-200 space-y-1.5">
                  {entry.signal.trim() && (
                    <p>
                      <span className="font-semibold text-slate-300">
                        Signal:
                      </span>{" "}
                      {entry.signal.length > 160
                        ? entry.signal.slice(0, 157) + "…"
                        : entry.signal}
                    </p>
                  )}
                  {entry.friction.trim() && (
                    <p>
                      <span className="font-semibold text-slate-300">
                        Friction:
                      </span>{" "}
                      {entry.friction.length > 160
                        ? entry.friction.slice(0, 157) + "…"
                        : entry.friction}
                    </p>
                  )}
                  {entry.alignment.trim() && (
                    <p>
                      <span className="font-semibold text-slate-300">
                        Alignment:
                      </span>{" "}
                      {entry.alignment.length > 160
                        ? entry.alignment.slice(0, 157) + "…"
                        : entry.alignment}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
