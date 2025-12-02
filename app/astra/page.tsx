"use client";

import { useEffect, useState } from "react";

type DeviceKind = "tv" | "lights" | "audio" | "other";

type AstraDevice = {
  id: string;
  name: string;
  location: string;
  kind: DeviceKind;
  isOn: boolean;
};

type CommandLogEntry = {
  id: string;
  timestamp: string; // ISO
  label: string;
  status: "success" | "error";
  detail?: string;
};

const API_BASE = process.env.NEXT_PUBLIC_ASTRA_API_BASE || "http://localhost:8787";

const API_KEY = process.env.NEXT_PUBLIC_ASTRA_API_KEY || "";

const DEVICES_STORAGE_KEY = "astra.devices.v1";
const LOG_STORAGE_KEY = "astra.log.v1";

const DEFAULT_DEVICES: AstraDevice[] = [
  {
    id: "primary-tv",
    name: "Primary Screen",
    location: "Living room",
    kind: "tv",
    isOn: false,
  },
  {
    id: "ambient-lights",
    name: "Ambient Lights",
    location: "Common areas",
    kind: "lights",
    isOn: false,
  },
  {
    id: "desk-lights",
    name: "Desk Lights",
    location: "Work corner",
    kind: "lights",
    isOn: false,
  },
  {
    id: "media-audio",
    name: "Media Audio",
    location: "Living room",
    kind: "audio",
    isOn: false,
  },
];

function loadDevices(): AstraDevice[] {
  if (typeof window === "undefined") return DEFAULT_DEVICES;
  const raw = window.localStorage.getItem(DEVICES_STORAGE_KEY);
  if (!raw) return DEFAULT_DEVICES;
  try {
    const parsed = JSON.parse(raw) as AstraDevice[];
    if (!Array.isArray(parsed)) return DEFAULT_DEVICES;
    return parsed;
  } catch {
    return DEFAULT_DEVICES;
  }
}

function saveDevices(devices: AstraDevice[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEVICES_STORAGE_KEY, JSON.stringify(devices));
}

function loadLog(): CommandLogEntry[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(LOG_STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as CommandLogEntry[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveLog(entries: CommandLogEntry[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(entries));
}

function formatTime(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export default function AstraPage() {
  const [devices, setDevices] = useState<AstraDevice[]>(DEFAULT_DEVICES);
  const [log, setLog] = useState<CommandLogEntry[]>([]);

  // Load state on mount
  useEffect(() => {
    setDevices(loadDevices());
    setLog(loadLog());
  }, []);

  const appendLog = (entry: CommandLogEntry) => {
    setLog((prev) => {
      const next = [entry, ...prev].slice(0, 50); // keep last 50
      saveLog(next);
      return next;
    });
  };

  const updateDevices = (updater: (prev: AstraDevice[]) => AstraDevice[]) => {
    setDevices((prev) => {
      const next = updater(prev);
      saveDevices(next);
      return next;
    });
  };

async function sendDeviceCommand(
  device: AstraDevice,
  desiredState: boolean
  ): Promise<"success" | "error"> {
    try {
      const res = await fetch(`${API_BASE}/api/astra/device/command`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-astra-key": process.env.NEXT_PUBLIC_ASTRA_API_KEY ?? "",
         },
        body: JSON.stringify({
          device_id: device.id,
          action: desiredState ? "on" : "off",
        }),
      });

      if (!res.ok) return "error";
      const data = await res.json();
      // Optionally you could use data.is_on to reconcile state
      return "success";
    } catch (err) {
      console.error("Astra device command failed:", err);
      return "error";
    }
  }


  const handleToggleDevice = async (id: string) => {
    const device = devices.find((d) => d.id === id);
    if (!device) return;

    const targetState = !device.isOn;
    const label = `${targetState ? "Turn ON" : "Turn OFF"} · ${
      device.name
    } (${device.location})`;

    const timestamp = new Date().toISOString();

    // Local optimistic update
    updateDevices((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              isOn: targetState,
            }
          : d
      )
    );

    const result = await sendDeviceCommand(device, targetState);

    appendLog({
      id: `${timestamp}-${id}`,
      timestamp,
      label,
      status: result,
    });
  };

  const handleScene = async (sceneId: string) => {
    const timestamp = new Date().toISOString();
    let label = "";

    if (sceneId === "focus") {
      label = "Scene: Focus (desk lights ON, ambient OFF, TV OFF)";
      updateDevices((prev) =>
        prev.map((d) => {
          if (d.id === "desk-lights") return { ...d, isOn: true };
          if (d.id === "ambient-lights") return { ...d, isOn: false };
          if (d.kind === "tv") return { ...d, isOn: false };
          return d;
        })
      );
    } else if (sceneId === "evening") {
      label = "Scene: Evening calm (ambient ON, desk OFF, TV ON)";
      updateDevices((prev) =>
        prev.map((d) => {
          if (d.id === "desk-lights") return { ...d, isOn: false };
          if (d.id === "ambient-lights") return { ...d, isOn: true };
          if (d.kind === "tv") return { ...d, isOn: true };
          return d;
        })
      );
    } else if (sceneId === "sleep") {
      label = "Scene: Sleep (all devices OFF)";
      updateDevices((prev) =>
        prev.map((d) => ({
          ...d,
          isOn: false,
        }))
      );
    } else {
      label = `Scene: ${sceneId}`;
    }

    // Call backend (non-blocking best-effort)
    try {
      await fetch(`${API_BASE}/api/astra/scene/activate`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-astra-key": process.env.NEXT_PUBLIC_ASTRA_API_KEY ?? "", 
        },
        body: JSON.stringify({ scene_id: sceneId }),
      });
    } catch (err) {
      console.error("Astra scene call failed:", err);
    }

    appendLog({
      id: `${timestamp}-scene-${sceneId}`,
      timestamp,
      label,
      status: "success",
    });
  };


  const onCount = devices.filter((d) => d.isOn).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Astra Control
            </p>
            <p className="text-sm text-slate-300">
              Local console for home scenes and devices. Currently simulated; ready
              for a tunnel-backed API.
            </p>
          </div>
          <div className="text-right text-xs text-slate-400">
            <p>
              Devices tracked:{" "}
              <span className="text-slate-100">{devices.length}</span>
            </p>
            <p>
              Active:{" "}
              <span className="text-emerald-300">
                {onCount} {onCount === 1 ? "device" : "devices"}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* Scenes row */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Scenes
        </p>
        <p className="text-xs text-slate-400">
          Quick patterns you&apos;ll later map to real home actions.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleScene("focus")}
            className="rounded-lg border border-sky-500/60 bg-sky-600/80 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-sky-500"
          >
            Focus
          </button>
          <button
            onClick={() => handleScene("evening")}
            className="rounded-lg border border-amber-500/60 bg-amber-600/80 px-3 py-2 text-xs font-semibold text-slate-950 hover:bg-amber-500"
          >
            Evening calm
          </button>
          <button
            onClick={() => handleScene("sleep")}
            className="rounded-lg border border-slate-500/60 bg-slate-700/80 px-3 py-2 text-xs font-semibold text-slate-50 hover:bg-slate-600"
          >
            Sleep
          </button>
        </div>
      </section>

      {/* Devices grid */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-1">
          Devices
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
            const isOn = device.isOn;
            return (
              <div
                key={device.id}
                className={`rounded-lg border p-3 text-sm transition-colors ${
                  isOn
                    ? "border-emerald-500/60 bg-emerald-500/10"
                    : "border-slate-800 bg-slate-950/40"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-slate-100">
                      {device.name}
                    </p>
                    <p className="text-xs text-slate-400">
                      {device.location} · {device.kind.toUpperCase()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] ${
                      isOn
                        ? "border-emerald-500/70 bg-emerald-600/20 text-emerald-200"
                        : "border-slate-700 bg-slate-800/70 text-slate-300"
                    }`}
                  >
                    {isOn ? "ON" : "OFF"}
                  </span>
                </div>
                <button
                  onClick={() => handleToggleDevice(device.id)}
                  className={`mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-xs font-semibold ${
                    isOn
                      ? "bg-slate-900/80 text-slate-100 border border-slate-600 hover:bg-slate-800"
                      : "bg-emerald-600/90 text-slate-950 border border-emerald-500/70 hover:bg-emerald-500"
                  }`}
                >
                  {isOn ? "Turn OFF" : "Turn ON"}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Command log */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Command log
          </p>
          <button
            onClick={() => {
              setLog([]);
              saveLog([]);
            }}
            className="text-[11px] text-slate-500 hover:text-rose-400"
          >
            Clear
          </button>
        </div>
        {log.length === 0 ? (
          <p className="text-xs text-slate-500">
            No commands yet. When you toggle devices or trigger scenes, they
            will appear here.
          </p>
        ) : (
          <ul className="space-y-1 text-xs text-slate-300 max-h-52 overflow-y-auto">
            {log.map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-3 border-b border-slate-800/80 pb-1"
              >
                <div>
                  <p className="text-slate-200">{entry.label}</p>
                  {entry.detail && (
                    <p className="text-[11px] text-slate-500">
                      {entry.detail}
                    </p>
                  )}
                </div>
                <div className="text-right text-[10px] text-slate-500">
                  <p>{formatTime(entry.timestamp)}</p>
                  <p
                    className={
                      entry.status === "success"
                        ? "text-emerald-300"
                        : "text-rose-300"
                    }
                  >
                    {entry.status}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
