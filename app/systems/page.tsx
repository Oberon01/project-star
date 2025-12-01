"use client";

import { useEffect, useState } from "react";

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

const STORAGE_KEY = "solaces.systems.profiles.v2";

const DEFAULT_SYSTEMS: SystemItem[] = [
  {
    id: "email",
    name: "Email / Communication",
    status: "unknown",
    notes: "",
  },
  {
    id: "tickets",
    name: "Ticketing / Helpdesk",
    status: "unknown",
    notes: "",
  },
  {
    id: "monitoring",
    name: "Monitoring / Alerts",
    status: "unknown",
    notes: "",
  },
  {
    id: "automation",
    name: "Automation / Scripts",
    status: "unknown",
    notes: "",
  },
  {
    id: "self",
    name: "Self (internal system)",
    status: "unknown",
    notes: "",
  },
];

const DEFAULT_PROFILES: Profile[] = [
  {
    id: "general",
    name: "General",
    systems: DEFAULT_SYSTEMS,
  },
  {
    id: "workday",
    name: "Workday",
    systems: DEFAULT_SYSTEMS.map((s) => ({ ...s, status: "unknown", notes: "" })),
  },
  {
    id: "oncall",
    name: "On-call",
    systems: DEFAULT_SYSTEMS.map((s) => ({ ...s, status: "unknown", notes: "" })),
  },
];

function loadState(): SystemsState {
  if (typeof window === "undefined") {
    return {
      activeProfileId: DEFAULT_PROFILES[0].id,
      profiles: DEFAULT_PROFILES,
    };
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {
      activeProfileId: DEFAULT_PROFILES[0].id,
      profiles: DEFAULT_PROFILES,
    };
  }

  try {
    const parsed = JSON.parse(raw) as SystemsState;
    if (!parsed || !Array.isArray(parsed.profiles)) {
      throw new Error("Invalid state");
    }
    const active =
      parsed.profiles.find((p) => p.id === parsed.activeProfileId) ??
      parsed.profiles[0] ??
      DEFAULT_PROFILES[0];
    return {
      activeProfileId: active.id,
      profiles: parsed.profiles,
    };
  } catch {
    return {
      activeProfileId: DEFAULT_PROFILES[0].id,
      profiles: DEFAULT_PROFILES,
    };
  }
}

function saveState(state: SystemsState) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function statusLabel(status: SystemStatus) {
  switch (status) {
    case "ok":
      return "OK";
    case "watch":
      return "Watch";
    case "issue":
      return "Issue";
    case "offline":
      return "Offline";
    default:
      return "Unknown";
  }
}

function statusClass(status: SystemStatus) {
  switch (status) {
    case "ok":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    case "watch":
      return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    case "issue":
      return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    case "offline":
      return "bg-slate-700/40 text-slate-300 border-slate-600/70";
    default:
      return "bg-slate-800/60 text-slate-300 border-slate-700/80";
  }
}

export default function SystemsPage() {
  const [state, setState] = useState<SystemsState>({
    activeProfileId: DEFAULT_PROFILES[0].id,
    profiles: DEFAULT_PROFILES,
  });

  const [newSystemName, setNewSystemName] = useState("");
  const [newSystemScope, setNewSystemScope] = useState<"all" | "current">("all");

  // Load state on mount
  useEffect(() => {
    const initial = loadState();
    setState(initial);
  }, []);

  const activeProfile =
    state.profiles.find((p) => p.id === state.activeProfileId) ??
    state.profiles[0];

  const updateState = (updater: (prev: SystemsState) => SystemsState) => {
    setState((prev) => {
      const next = updater(prev);
      saveState(next);
      return next;
    });
  };

  const setActiveProfile = (id: string) => {
    updateState((prev) => ({
      ...prev,
      activeProfileId: id,
    }));
  };

  const updateSystem = (systemId: string, patch: Partial<SystemItem>) => {
    if (!activeProfile) return;
    updateState((prev) => {
      const profiles = prev.profiles.map((profile) => {
        if (profile.id !== prev.activeProfileId) return profile;
        const systems = profile.systems.map((sys) =>
          sys.id === systemId ? { ...sys, ...patch } : sys
        );
        return { ...profile, systems };
      });
      return { ...prev, profiles };
    });
  };

  const handleAddSystem = () => {
    const name = newSystemName.trim();
    if (!name) return;

    const idBase = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
    const uniqueId = `${idBase || "system"}-${Date.now().toString(16)}`;

    const template: SystemItem = {
      id: uniqueId,
      name,
      status: "unknown",
      notes: "",
    };

    updateState((prev) => {
      const profiles = prev.profiles.map((profile) => {
        if (newSystemScope === "all" || profile.id === prev.activeProfileId) {
          return {
            ...profile,
            systems: [...profile.systems, { ...template }],
          };
        }
        return profile;
      });

      return {
        ...prev,
        profiles,
      };
    });

    setNewSystemName("");
  };

  const handleRemoveSystemGlobal = (systemId: string) => {
    updateState((prev) => {
      const profiles = prev.profiles.map((profile) => ({
        ...profile,
        systems: profile.systems.filter((sys) => sys.id !== systemId),
      }));
      return { ...prev, profiles };
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Systems Atlas
            </p>
            <p className="text-sm text-slate-300">
              Manual map of the systems you depend on — external and internal.
            </p>
          </div>
          <div className="flex flex-col items-start gap-1 text-xs text-slate-500 sm:items-end">
            <span>Profiles</span>
            <select
              value={activeProfile?.id ?? ""}
              onChange={(e) => setActiveProfile(e.target.value)}
              className="w-40 bg-slate-950/60 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-slate-500"
            >
              {state.profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-slate-600">
              Each profile keeps its own statuses and notes.
            </span>
          </div>
        </div>
      </section>

      {/* Add system */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Add system
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={newSystemName}
            onChange={(e) => setNewSystemName(e.target.value)}
            placeholder="System name (e.g. 'Change Management', 'Backup jobs')"
            className="flex-1 bg-slate-950/60 border border-slate-700 rounded-md px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-slate-500"
          />
          <select
            value={newSystemScope}
            onChange={(e) => setNewSystemScope(e.target.value as "all" | "current")}
            className="w-40 bg-slate-950/60 border border-slate-700 rounded-md px-2 py-2 text-xs text-slate-100 focus:outline-none focus:border-slate-500"
          >
            <option value="all">All profiles</option>
            <option value="current">Only this profile</option>
          </select>
          <button
            onClick={handleAddSystem}
            className="mt-2 inline-flex justify-center rounded-lg border border-sky-500/60 bg-sky-600/80 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-500 sm:mt-0"
          >
            Add
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          New systems are added across all profiles by default, or only to the
          current profile if you choose so.
        </p>
      </section>

      {/* Table-ish layout */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="grid grid-cols-[1.4fr,0.8fr,2fr,auto] gap-3 text-[11px] text-slate-500 mb-1 px-1">
          <span>System</span>
          <span>Status</span>
          <span>Notes</span>
          <span className="text-right">Actions</span>
        </div>

        <div className="space-y-3">
          {activeProfile?.systems.map((sys) => (
            <div
              key={sys.id}
              className="grid grid-cols-1 gap-3 rounded-lg border border-slate-800 bg-slate-950/40 p-3 sm:grid-cols-[1.4fr,0.8fr,2fr,auto]"
            >
              {/* Name */}
              <div>
                <p className="text-sm font-medium text-slate-100">
                  {sys.name}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center gap-2">
                <select
                  value={sys.status}
                  onChange={(e) =>
                    updateSystem(sys.id, {
                      status: e.target.value as SystemStatus,
                    })
                  }
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-slate-500"
                >
                  <option value="unknown">Unknown</option>
                  <option value="ok">OK</option>
                  <option value="watch">Watch</option>
                  <option value="issue">Issue</option>
                  <option value="offline">Offline</option>
                </select>
                <span
                  className={
                    "hidden sm:inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] " +
                    statusClass(sys.status)
                  }
                >
                  {statusLabel(sys.status)}
                </span>
              </div>

              {/* Notes */}
              <div>
                <textarea
                  value={sys.notes}
                  onChange={(e) =>
                    updateSystem(sys.id, { notes: e.target.value })
                  }
                  rows={2}
                  className="w-full bg-slate-950/60 border border-slate-700 rounded-md p-2 text-xs text-slate-100 focus:outline-none focus:border-slate-500"
                  placeholder="Dependencies, concerns, or what to watch for (e.g. 'NOC paging noisy today', 'Self: low sleep')."
                />
              </div>

              {/* Actions */}
              <div className="flex items-start justify-end">
                <button
                  onClick={() => handleRemoveSystemGlobal(sys.id)}
                  className="text-[11px] text-slate-500 hover:text-rose-400"
                >
                  Remove (all profiles)
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <p className="text-[11px] text-slate-500">
        This board is local to this browser. Adding/removing systems applies
        across profiles, while each profile keeps its own status and notes.
      </p>
    </div>
  );
}
