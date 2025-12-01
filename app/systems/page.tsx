export default function SystemsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-100">Systems Atlas</h1>

      <p className="text-slate-400 text-sm">
        A future dashboard showing status of your nodes, tunnel uptime, home 
        server heartbeat, and internal network indicators.
      </p>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
        <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
          Status: Offline
        </p>
        <p className="text-sm text-slate-300 mt-2">
          Once connected to your home tunnel, system health indicators will populate here.
        </p>
      </div>
    </div>
  );
}
