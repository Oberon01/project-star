"use client";

import { useEffect, useState } from "react";

type DeviceKind = "tv" | "lights" | "audio" | "door" | "other";

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

type RokuApp = {
  id: string;
  name: string;
};


const API_BASE =
  process.env.NEXT_PUBLIC_ASTRA_API_BASE ||
  "http://192.168.1.146:8787/api/astra";

const ASTRA_KEY =
  process.env.NEXT_PUBLIC_ASTRA_API_KEY || "cuDM8r2jX5lAAvBr8jr3";

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

function loadDevicesFromStorage(): AstraDevice[] {
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

function saveDevicesToStorage(devices: AstraDevice[]) {
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
  const [devices, setDevices] = useState<AstraDevice[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [rokuApps, setRokuApps] = useState<Record<string, RokuApp[]>>({});
  const [selectedRokuApp, setSelectedRokuApp] = useState<Record<string, string>>({});
  const [activeRokuId, setActiveRokuId] = useState<string | null>(null);
  const [rokuBusy, setRokuBusy] = useState(false);
  const [log, setLog] = useState<CommandLogEntry[]>([]);

  // 🔹 helper to append to the command log and persist to localStorage
  const appendLog = (entry: CommandLogEntry) => {
    setLog((prev) => {
      const next = [entry, ...prev].slice(0, 50); // keep last 50
      saveLog(next);
      return next;
    });
  };

  // Load log + devices on mount (remote first, local fallback) + live polling
  useEffect(() => {
    setLog(loadLog());

    let cancelled = false;
    let intervalId: number | undefined;

    async function fetchDevices(showLoading: boolean) {
      try {
        if (showLoading) {
          setLoadingDevices(true);
          setLoadError(null);
        }

        const res = await fetch(`${API_BASE}/devices`, {
          headers: {
            "x-astra-key": ASTRA_KEY,
          },
        });

        if (!res.ok) {
          const text = await res.text();
          console.error("Failed to load devices:", res.status, text);
          setLoadError(`HTTP ${res.status}`);
          // fallback to local storage/defaults (only on initial fail)
          if (showLoading) {
            const local = loadDevicesFromStorage();
            setDevices(local);
          }
          return;
        }

        const data = await res.json();
        const mapped: AstraDevice[] = data.map((d: any) => ({
          id: d.id,
          name: d.name,
          location: d.location,
          kind: d.kind,
          isOn: d.is_on ?? d.isOn ?? false,
        }));

        if (!cancelled) {
          setDevices(mapped);
          saveDevicesToStorage(mapped);
        }
      } catch (err: any) {
        console.error("Error loading devices:", err);
        setLoadError(err?.message ?? "Unknown error");
        if (showLoading) {
          const local = loadDevicesFromStorage();
          setDevices(local);
        }
      } finally {
        if (showLoading && !cancelled) {
          setLoadingDevices(false);
        }
      }
    }

    // Initial load with spinner
    fetchDevices(true);

    // Poll every 5 seconds without flickering the loading UI
    intervalId = window.setInterval(() => {
      fetchDevices(false);
    }, 5000);

    // Cleanup when leaving the Astra page
    return () => {
      cancelled = true;
      if (intervalId !== undefined) {
        clearInterval(intervalId);
      }
    };
  }, []);

  async function loadRokuApps(deviceId: string) {
    try {
      const res = await fetch(
        `${API_BASE}/roku/apps?device_id=${encodeURIComponent(deviceId)}`,
        {
          headers: {
            "x-astra-key": ASTRA_KEY,
          },
        }
      );

      if (!res.ok) throw new Error("Failed to load Roku apps");

      const apps: RokuApp[] = await res.json();

      setRokuApps((prev) => ({ ...prev, [deviceId]: apps }));

      if (apps.length > 0 && !selectedRokuApp[deviceId]) {
        setSelectedRokuApp((prev) => ({
          ...prev,
          [deviceId]: apps[0].id,
        }));
      }
    } catch (err) {
      console.error("Failed to load Roku apps", err);
    }
  }

  async function launchRokuApp(deviceId: string) {
    const appId = selectedRokuApp[deviceId];
    if (!appId) return;

    setRokuBusy(true);
    try {
      const res = await fetch(`${API_BASE}/roku/launch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-astra-key": ASTRA_KEY,
        },
        body: JSON.stringify({
          device_id: deviceId,
          app_id: appId,
        }),
      });

      if (!res.ok) {
        console.error("Failed to launch Roku app", await res.text());
      }
    } catch (err) {
      console.error("Failed to launch Roku app", err);
    } finally {
      setRokuBusy(false);
    }
  }

  async function sendRokuRemote(deviceId: string, button: string) {
    try {
      const res = await fetch(`${API_BASE}/roku/remote`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-astra-key": ASTRA_KEY,
        },
        body: JSON.stringify({ device_id: deviceId, button }),
      });

      if (!res.ok) {
        console.error("Roku remote failed", await res.text());
      }
    } catch (err) {
      console.error("Roku remote error", err);
    }
  }


  const updateDevices = (updater: (prev: AstraDevice[]) => AstraDevice[]) => {
    setDevices((prev) => {
      const next = updater(prev);
      saveDevicesToStorage(next);
      return next;
    });
  };

  async function sendDeviceCommand(
    device: AstraDevice,
    desiredState: boolean
  ): Promise<"success" | "error"> {
    try {
      const res = await fetch(`${API_BASE}/device/command`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-astra-key": ASTRA_KEY ?? "",
        },
        body: JSON.stringify({
          device_id: device.id,
          action: desiredState ? "on" : "off",
        }),
      });

      if (!res.ok) {
        console.error(
          "Astra command HTTP error:",
          res.status,
          await res.text()
        );
        return "error";
      }

      const data = await res.json();
      // Optionally reconcile with backend state: data.is_on
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
          if (d.id === "kitchen-light") return { ...d, isOn: true };
          if (d.id === "living-room-light") return { ...d, isOn: false };
          if (d.kind === "tv") return { ...d, isOn: false };
          return d;
        })
      );
    } else if (sceneId === "evening") {
      label = "Scene: Evening calm (ambient ON, desk OFF, TV ON)";
      updateDevices((prev) =>
        prev.map((d) => {
          if (d.id === "kitchen-light") return { ...d, isOn: false };
          if (d.id === "living-room-light") return { ...d, isOn: true };
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
      await fetch(`${API_BASE}/scene/activate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-astra-key": ASTRA_KEY ?? "",
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
              Local console for home scenes and devices, now wired into the
              Astra gateway.
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
          Quick patterns you&apos;ll later map to more devices and deeper
          automation.
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

        {loadingDevices ? (
          <p className="text-xs text-slate-500">Loading devices…</p>
        ) : loadError ? (
          <p className="text-xs text-rose-400">
            Failed to load devices from gateway ({loadError}). Using cached
            list.
          </p>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {devices.map((device) => {
          const isOn = device.isOn;
          const isDoor = device.kind === "door";

          const statusText = isDoor
            ? isOn
              ? "LOCKED"
              : "UNLOCKED"
            : isOn
            ? "ON"
            : "OFF";

          const buttonLabel = isDoor
            ? isOn
              ? "Unlock door"
              : "Lock door"
            : isOn
            ? "Turn OFF"
            : "Turn ON";

          return (
            <div key={device.id} /* your card wrapper */>
              {/* header: name + location */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-slate-100">{device.name}</p>
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
                  {statusText}
                </span>
              </div>

              {/* toggle button */}
              <button
                onClick={() => handleToggleDevice(device.id)}
                className={`mt-3 inline-flex w-full justify-center rounded-md px-3 py-2 text-xs font-semibold ${
                  isOn
                    ? "bg-slate-900/80 text-slate-100 border border-slate-600 hover:bg-slate-800"
                    : "bg-emerald-600/90 text-slate-950 border border-emerald-500/70 hover:bg-emerald-500"
                }`}
              >
                {buttonLabel}
              </button>
              {device.kind === "tv" && (
                <div className="mt-3 space-y-2">
                  {/* Toggle Roku panel */}
                  <button
                    type="button"
                    onClick={() => {
                      const next = activeRokuId === device.id ? null : device.id;
                      setActiveRokuId(next);
                      if (next) {
                        // lazy-load apps when opening panel
                        if (!rokuApps[device.id]) {
                          loadRokuApps(device.id);
                        }
                      }
                    }}
                    className="w-full rounded-md border border-slate-600 bg-slate-900/60 px-3 py-2 text-xs font-semibold text-slate-100 hover:bg-slate-800"
                  >
                    {activeRokuId === device.id ? "Hide Roku controls" : "Show Roku controls"}
                  </button>

                  {activeRokuId === device.id && (
                    <div className="rounded-md border border-slate-700 bg-slate-950/80 p-2 space-y-2">
                      {/* App picker */}
                      <div className="space-y-1">
                        <label className="block text-[10px] uppercase tracking-wide text-slate-400">
                          App
                        </label>
                        <select
                          className="w-full rounded-sm border border-slate-700 bg-slate-900/80 px-2 py-1 text-xs text-slate-100"
                          value={selectedRokuApp[device.id] ?? ""}
                          onChange={(e) =>
                            setSelectedRokuApp((prev) => ({
                              ...prev,
                              [device.id]: e.target.value,
                            }))
                          }
                        >
                          {(rokuApps[device.id] ?? []).map((app) => (
                            <option key={app.id} value={app.id}>
                              {app.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => launchRokuApp(device.id)}
                          disabled={rokuBusy}
                          className="mt-1 w-full rounded-sm bg-emerald-600/90 px-2 py-1 text-[11px] font-semibold text-slate-950 hover:bg-emerald-500 disabled:opacity-50"
                        >
                          {rokuBusy ? "Launching..." : "Launch app"}
                        </button>
                      </div>

                      {/* Remote */}
                      <div className="space-y-1">
                        <div className="text-[10px] uppercase tracking-wide text-slate-400">
                          Remote
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <button onClick={() => sendRokuRemote(device.id, "home")} className="rounded bg-slate-800/80 py-1">
                            Home
                          </button>
                          <button onClick={() => sendRokuRemote(device.id, "back")} className="rounded bg-slate-800/80 py-1">
                            Back
                          </button>
                          <button onClick={() => sendRokuRemote(device.id, "play_pause")} className="rounded bg-slate-800/80 py-1">
                            ▶︎/⏸
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-1 text-xs">
                          <div />
                          <button onClick={() => sendRokuRemote(device.id, "up")} className="rounded bg-slate-800/80 py-1">
                            ▲
                          </button>
                          <div />
                          <button onClick={() => sendRokuRemote(device.id, "left")} className="rounded bg-slate-800/80 py-1">
                            ◀
                          </button>
                          <button onClick={() => sendRokuRemote(device.id, "select")} className="rounded bg-emerald-600/80 py-1 font-semibold text-slate-950">
                            OK
                          </button>
                          <button onClick={() => sendRokuRemote(device.id, "right")} className="rounded bg-slate-800/80 py-1">
                            ▶
                          </button>
                          <div />
                          <button onClick={() => sendRokuRemote(device.id, "down")} className="rounded bg-slate-800/80 py-1">
                            ▼
                          </button>
                          <div />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

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
