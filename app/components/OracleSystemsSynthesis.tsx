"use client";

import { useEffect, useState } from "react";

type OracleEntry = {
  signal: string;
  friction: string;
  alignment: string;
};

type SystemStatus = "ok" | "watch" | "issue" | "offline" | "unknown";

type SystemItem = {
  id: string;
  name: string;
  status: SystemStatus;
  notes: string;
};

type Profile = {
  id: string;
  name: string;
  systems: SystemItem[];
};

type SystemsState = {
  activeProfileId: string;
  profiles: Profile[];
};

const ORACLE_PREFIX = "solaces.oracle.daily";
const SYSTEMS_KEY = "solaces.systems.profiles.v2";

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

function readTodayOracle(): OracleEntry | null {
  if (typeof window === "undefined") return null;
  const dateKey = getTodayKey();
  const storageKey = `${ORACLE_PREFIX}:${dateKey}`;
  const raw = window.localStorage.getItem(storageKey);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as OracleEntry;
    return {
      signal: parsed.signal ?? "",
      friction: parsed.friction ?? "",
      alignment: parsed.alignment ?? "",
    };
  } catch {
    return null;
  }
}

function readActiveSystems():
  | { profileName: string; systems: SystemItem[] }
  | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SYSTEMS_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SystemsState;
    if (!parsed || !Array.isArray(parsed.profiles)) return null;
    const active =
      parsed.profiles.find((p) => p.id === parsed.activeProfileId) ??
      parsed.profiles[0];
    if (!active) return null;
    return {
      profileName: active.name,
      systems: active.systems ?? [],
    };
  } catch {
    return null;
  }
}

const statusImportance: SystemStatus[] = [
  "issue",
  "watch",
  "offline",
  "ok",
  "unknown",
];

export default function OracleSystemsSynthesis() {
  const [oracle, setOracle] = useState<OracleEntry | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [systems, setSystems] = useState<SystemItem[]>([]);

  useEffect(() => {
    const o = readTodayOracle();
    const s = readActiveSystems();
    setOracle(o);
    if (s) {
      setProfileName(s.profileName);
      setSystems(s.systems);
    } else {
      setProfileName(null);
      setSystems([]);
    }
  }, []);

  const todayKey = getTodayKey();
  const criticalSystems = systems.filter(
    (s) => s.status === "issue" || s.status === "watch"
  );
  const counts = systems.reduce(
    (acc, s) => {
      acc[s.status] = (acc[s.status] || 0) + 1;
      return acc;
    },
    {} as Record<SystemStatus, number>
  );

  const hasOracleContent =
    oracle &&
    (oracle.signal.trim() ||
      oracle.friction.trim() ||
      oracle.alignment.trim());

  if (!hasOracleContent && systems.length === 0) {
    // Nothing to synthesize yet; stay invisible to avoid noise on a fresh setup
    return null;
  }

  return (
    <section className="mt-6 rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Daily synthesis
          </p>
          <p className="text-sm text-slate-300">
            A quick merge of today&apos;s reflection and system state.
          </p>
        </div>
        <div className="text-right text-xs text-slate-500">
          <p className="font-mono">{formatDateLabel(todayKey)}</p>
          {profileName && (
            <p className="mt-1">
              Active profile:{" "}
              <span className="text-slate-300">{profileName}</span>
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Oracle snapshot */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Oracle snapshot
          </p>
          {hasOracleContent ? (
            <div className="space-y-2 text-sm text-slate-200">
              {oracle?.signal.trim() && (
                <div>
                  <p className="text-[11px] text-slate-500 mb-0.5">Signal</p>
                  <p className="whitespace-pre-wrap bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2">
                    {oracle.signal}
                  </p>
                </div>
              )}
              {oracle?.friction.trim() && (
                <div>
                  <p className="text-[11px] text-slate-500 mb-0.5">Friction</p>
                  <p className="whitespace-pre-wrap bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2">
                    {oracle.friction}
                  </p>
                </div>
              )}
              {oracle?.alignment.trim() && (
                <div>
                  <p className="text-[11px] text-slate-500 mb-0.5">
                    Alignment
                  </p>
                  <p className="whitespace-pre-wrap bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2">
                    {oracle.alignment}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-slate-500">
              No Oracle entry saved for today yet.
            </p>
          )}
        </div>

        {/* Systems summary */}
        <div className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">
            Systems summary
          </p>

          {systems.length === 0 ? (
            <p className="text-xs text-slate-500">
              No systems tracked yet in the active profile.
            </p>
          ) : (
            <>
              {/* Status counts */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                {statusImportance.map((status) => {
                  const count = counts[status] || 0;
                  if (!count) return null;
                  const label =
                    status === "ok"
                      ? "OK"
                      : status === "watch"
                      ? "Watch"
                      : status === "issue"
                      ? "Issue"
                      : status === "offline"
                      ? "Offline"
                      : "Unknown";

                  const baseClasses =
                    "inline-flex items-center rounded-full border px-2 py-0.5";
                  let colorClasses =
                    "border-slate-700 text-slate-300 bg-slate-900/60";
                  if (status === "ok") {
                    colorClasses =
                      "border-emerald-500/60 text-emerald-300 bg-emerald-500/10";
                  } else if (status === "watch") {
                    colorClasses =
                      "border-amber-500/60 text-amber-200 bg-amber-500/10";
                  } else if (status === "issue") {
                    colorClasses =
                      "border-rose-500/60 text-rose-200 bg-rose-500/10";
                  } else if (status === "offline") {
                    colorClasses =
                      "border-slate-600 text-slate-200 bg-slate-700/40";
                  }

                  return (
                    <span key={status} className={`${baseClasses} ${colorClasses}`}>
                      {label}: {count}
                    </span>
                  );
                })}
              </div>

              {/* Pressure points */}
              <div className="space-y-1 text-xs text-slate-400">
                {criticalSystems.length === 0 ? (
                  <p>No systems marked as Issue/Watch in this profile.</p>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-500">
                      Pressure points:
                    </p>
                    <ul className="space-y-1">
                      {criticalSystems.slice(0, 4).map((sys) => (
                        <li key={sys.id}>
                          <span className="text-slate-200">{sys.name}</span>
                          {sys.notes && (
                            <span className="text-slate-500">
                              {" "}
                              — {sys.notes}
                            </span>
                          )}
                        </li>
                      ))}
                      {criticalSystems.length > 4 && (
                        <li className="text-slate-500">
                          …and {criticalSystems.length - 4} more.
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
