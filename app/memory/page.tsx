"use client";

import { useEffect, useState } from "react";

type MemoryItem = {
  id: string;
  title: string;
  body: string;
  tag: string;
  createdAt: string; // ISO string
};

const STORAGE_KEY = "solaces.memory.v1";

function loadMemories(): MemoryItem[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as MemoryItem[];
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    return [];
  }
}

function saveMemories(items: MemoryItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function formatDate(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MemoryPage() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");

  // Load initial data
  useEffect(() => {
    const initial = loadMemories();
    setItems(initial);
  }, []);

  const handleAdd = () => {
    if (!title.trim() && !body.trim()) return;

    const newItem: MemoryItem = {
      id: crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title: title.trim() || "(untitled)",
      body: body.trim(),
      tag: tag.trim(),
      createdAt: new Date().toISOString(),
    };

    const next = [newItem, ...items];
    setItems(next);
    saveMemories(next);

    setTitle("");
    setBody("");
    setTag("");
  };

  const handleDelete = (id: string) => {
    const next = items.filter((m) => m.id !== id);
    setItems(next);
    saveMemories(next);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 px-4 py-4 sm:px-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
              Memory Keep
            </p>
            <p className="text-sm text-slate-300">
              A small vault for fragments worth carrying forward.
            </p>
          </div>
          <div className="text-xs text-slate-500">
            <span>{items.length} stored</span>
          </div>
        </div>
      </section>

      {/* New memory form */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 space-y-3">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          Capture
        </p>
        <div className="space-y-2">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (optional, e.g. 'Pattern I noticed in myself')"
            className="w-full bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Write the memory, insight, quote, or fragment here..."
            rows={4}
            className="w-full bg-slate-950/40 border border-slate-800 rounded-lg p-3 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Tag (e.g. 'insight', 'warning', 'quote')"
              className="w-full sm:w-1/3 bg-slate-950/40 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-slate-700"
            />
            <button
              onClick={handleAdd}
              className="mt-2 inline-flex justify-center rounded-lg border border-emerald-500/60 bg-emerald-600/80 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-emerald-500 sm:mt-0"
            >
              Store memory
            </button>
          </div>
        </div>
      </section>

      {/* List of memories */}
      <section className="space-y-3">
        {items.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 text-sm text-slate-400">
            Nothing stored yet. Capture things you don&apos;t want to carry in
            working memory — so your head can stay clear.
          </div>
        ) : (
          items.map((item) => (
            <article
              key={item.id}
              className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-slate-50">
                    {item.title}
                  </h2>
                  <div className="mt-1 text-xs text-slate-500">
                    {formatDate(item.createdAt)}
                    {item.tag && (
                      <span className="ml-2 inline-flex items-center rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-300">
                        {item.tag}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-[11px] text-slate-500 hover:text-rose-400"
                >
                  Delete
                </button>
              </div>
              {item.body && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-slate-200">
                  {item.body}
                </p>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
