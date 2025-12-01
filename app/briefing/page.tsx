"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "solaces.briefing.v1";

type BriefingState = {
  focus: string;
  stateWord: string;
  priorities: string[];
  signals: string;
  boundaries: string;
};

const defaultState: BriefingState = {
  focus: "",
  stateWord: "",
  priorities: ["", "", ""],
  signals: "",
  boundaries: "",
};

export default function BriefingPage() {
  const [data, setData] = useState<BriefingState>(defaultState);

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setData({ ...defaultState, ...JSON.parse(stored) });
      } catch {
        // ignore parse errors, fall back to default
      }
    }
  }, []);

  // Save on change
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const updatePriority = (index: number, value: string) => {
    const next = [...data.priorities];
    next[index] = value;
    setData({ ...data, priorities: next });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Field Briefing
            </p>
            <p className="text-sm text-slate-300">
              A quiet snapshot of what actually matters today.
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p className="font-mono">{today}</p>
            {data.stateWord && (
              <p className="mt-1 text-slate-300">State: {data.stateWord}</p>
            )}
          </div>
        </div>
      </section>

      {/* Row: Focus + State */}
      <section className="grid gap-4 md:grid-cols-[2fr,1fr]">
        {/* Focus */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
            Today&apos;s focus
          </p>
          <textarea
            value={data.focus}
            onChange={(e) => setData({ ...data, focus: e.target.value })}
            placeholder="What is this day actually for? (one or two sentences)"
            rows={3}
            className="w-full bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
          />
        </div>

        {/* State word */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
            Internal state
          </p>
          <input
            value={data.stateWord}
            onChange={(e) =>
              setData({ ...data, stateWord: e.target.value.slice(0, 32) })
            }
            placeholder="Calm, strained, clear, foggy..."
            className="w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
          />
          <p className="mt-2 text-[11px] text-slate-500">
            One word is enough. It&apos;s for awareness, not judgment.
          </p>
        </div>
      </section>

      {/* Priorities */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
          Three priorities
        </p>
        <p className="text-xs text-slate-400 mb-3">
          What must move forward today, even if nothing else does?
        </p>
        <div className="space-y-2">
          {data.priorities.map((p, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="w-5 text-xs text-slate-500">{i + 1}.</span>
              <input
                value={p}
                onChange={(e) => updatePriority(i, e.target.value)}
                className="flex-1 bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
                placeholder="Describe a single concrete outcome."
              />
            </div>
          ))}
        </div>
      </section>

      {/* Signals + Boundaries */}
      <section className="grid gap-4 md:grid-cols-2">
        {/* Signals to watch */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
            Signals to watch
          </p>
          <p className="text-xs text-slate-400 mb-2">
            What inputs or changes actually matter today? (Not every notification.)
          </p>
          <textarea
            value={data.signals}
            onChange={(e) =>
              setData({ ...data, signals: e.target.value })
            }
            rows={5}
            className="w-full bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
            placeholder="- Email from X about Y\n- Ticket status on Z\n- Any escalation from NOC..."
          />
        </div>

        {/* Boundaries */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
            Boundaries for today
          </p>
          <p className="text-xs text-slate-400 mb-2">
            Simple rules that keep you aligned while you work.
          </p>
          <textarea
            value={data.boundaries}
            onChange={(e) =>
              setData({ ...data, boundaries: e.target.value })
            }
            rows={5}
            className="w-full bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
            placeholder="- No new projects after 3 PM\n- Pause before saying yes\n- Step away 5 minutes if overloaded..."
          />
        </div>
      </section>
    </div>
  );
}
