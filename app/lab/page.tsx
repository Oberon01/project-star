import Link from "next/link";

export default function LabPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold text-slate-100">Solaces Lab</h1>

      <p className="text-slate-400 text-sm">
        Experimental tools and utilities will live here. Build and test ideas 
        before promoting them to the main cockpit.
      </p>

      <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 space-y-2">
        <p className="text-xs text-slate-500 uppercase tracking-[0.2em]">
          Sandbox
        </p>

        <ul className="space-y-1 text-sm">
          <li>
            <Link href="#" className="text-sky-400 hover:text-sky-300">
              Example Tool (placeholder)
            </Link>
          </li>
        </ul>
      </div>
    </div>
  );
}
