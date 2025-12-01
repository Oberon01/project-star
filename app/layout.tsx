// app/layout.tsx
import "@/app/globals.css"
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "solaces.me",
  description: "Personal control panel and inner mirror.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full bg-slate-950 text-slate-100 antialiased">
        <div className="min-h-screen flex flex-col">
          {/* Top bar */}
          <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">
                  solaces
                </span>
                <span className="text-xs text-slate-600">/ core</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="hidden sm:inline">Private console</span>
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.8)]" />
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            <div className="mx-auto max-w-5xl px-4 py-6 sm:py-8">
              {children}
            </div>
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-900 text-xs text-slate-600">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
              <span>solaces.me · internal</span>
              <span className="hidden sm:inline">v0.1 · Astra / Oracle / Systems</span>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
