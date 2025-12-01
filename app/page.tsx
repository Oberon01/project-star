// app/page.tsx
import Link from "next/link";
import OracleSystemsSynthesis from "./components/OracleSystemsSynthesis";

function formatToday() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function HomePage() {
  const today = formatToday();

  // Static for now – later you can fetch live data from Astra / Systems APIs
  const homeStatus = "Connected"; // or "Unknown" / "Disconnected"
  const systemsSummary = "Core nodes responsive"; // stub text
  const latestReflection = "No entry yet for today."; // can wire to storage later

  const shortcuts = [
    { label: "Astra control panel", href: "/astra" },
    { label: "Systems atlas", href: "/systems" },
    { label: "Oracle mirror", href: "/oracle" },
    { label: "Field briefing", href: "/briefing" },
    { label: "Memory keep", href: "/memory"},
    { label: "Lab", href: "/lab" },
    
  ];

  return (
    <div className="space-y-6">
      {/* Top: Now strip */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-3 sm:px-5 sm:py-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Now
            </p>
            <p className="text-sm text-slate-300">
              Phase: <span className="font-medium text-slate-100">Stabilize systems</span>
              {" · "}
              Priority: <span className="text-slate-200">Reduce friction in home ops</span>
            </p>
          </div>
          <div className="text-xs text-slate-400">
            <p className="font-mono">{today}</p>
          </div>
        </div>
      </section>

      {/* Middle: Core panels */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Astra */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Home / Astra
            </p>
            <h2 className="text-sm font-semibold text-slate-50">Home control</h2>
            <p className="text-xs text-slate-400">
              Quick access to TV, scenes, and home routines via the Astra tunnel.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(74,222,128,0.8)]" />
              <span className="text-slate-300">{homeStatus}</span>
            </div>
            <Link
              href="/astra"
              className="text-xs font-medium text-emerald-400 hover:text-emerald-300"
            >
              Open
            </Link>
          </div>
        </div>

        {/* Systems */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Systems
            </p>
            <h2 className="text-sm font-semibold text-slate-50">Infra status</h2>
            <p className="text-xs text-slate-400">
              Snapshot of core nodes and tunnels. Replace this text with live health later.
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-300 truncate max-w-[60%]">
              {systemsSummary}
            </span>
            <Link
              href="/systems"
              className="text-xs font-medium text-sky-400 hover:text-sky-300"
            >
              Details
            </Link>
          </div>
        </div>

        {/* Oracle */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between">
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Inner / Oracle
            </p>
            <h2 className="text-sm font-semibold text-slate-50">Reflection</h2>
            <p className="text-xs text-slate-400 line-clamp-3">
              {latestReflection}
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-slate-400">Today&apos;s entry: pending</span>
            <Link
              href="/oracle"
              className="text-xs font-medium text-violet-400 hover:text-violet-300"
            >
              Open
            </Link>
          </div>
        </div>
      </section>

      {/* Bottom: Shortcuts & scratch */}
      <section className="grid gap-4 md:grid-cols-[2fr,3fr]">
        {/* Shortcuts */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
            Shortcuts
          </p>
          <ul className="space-y-1.5 text-sm">
            {shortcuts.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-slate-800/80"
                >
                  <span className="text-slate-200">{item.label}</span>
                  <span className="text-[10px] text-slate-500">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Scratchpad (local-only later) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-2">
            Scratch
          </p>
          <p className="text-xs text-slate-400 mb-2">
            For now this is just placeholder text. Later, you can turn this into
            a local-only scratchpad or &quot;3 tasks for today&quot; widget
            using <code className="font-mono text-[10px]">localStorage</code>.
          </p>
          <div className="rounded-lg border border-dashed border-slate-700/80 px-3 py-2 text-xs text-slate-500">
            &quot;What do I actually need to do in the next 2 hours?&quot;
          </div>
        </div>
      </section>
      <OracleSystemsSynthesis />
    </div>
  );
}
