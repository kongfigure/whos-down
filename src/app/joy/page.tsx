"use client";
import { useEffect, useMemo, useState } from "react";

type JoyTask = {
  id: string;
  title: string;
  note?: string;
  location?: string;
  done?: boolean;
};

export default function JoyPage() {
  const [tasks, setTasks] = useState<JoyTask[]>([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [bootLoading, setBootLoading] = useState<boolean>(true);  // initial auto-seed
  const [msg, setMsg] = useState<string | null>(null);

  // daily key so it re-seeds once per day
  const todayKey = useMemo(() => new Date().toDateString(), []);

  // On mount: load from localStorage, else auto-generate 3 tasks with AI
  useEffect(() => {
    try {
      const saved = localStorage.getItem("joyDailySeed");
      if (saved) {
        const parsed = JSON.parse(saved) as { date: string; items: JoyTask[] };
        if (parsed.date === todayKey && Array.isArray(parsed.items) && parsed.items.length) {
          setTasks(parsed.items);
          setBootLoading(false);
          return;
        }
      }
    } catch {}

    // No saved for today → auto seed with AI
    (async () => {
      try {
        setMsg(null);
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ count: 3, existing: [] }),
        });
        const data = await res.json();
        if (!res.ok || !Array.isArray(data?.items)) {
          throw new Error(data?.error || "Failed to auto-generate daily tasks");
        }
        const items: JoyTask[] = data.items.map((title: string) => ({
          id: crypto.randomUUID(),
          title,
          done: false,
        }));
        setTasks(items);
        localStorage.setItem("joyDailySeed", JSON.stringify({ date: todayKey, items }));
      } catch (e: any) {
        setMsg(e?.message || "Could not auto-generate tasks");
        // fallback: show empty or a small default
        setTasks([]);
      } finally {
        setBootLoading(false);
      }
    })();
  }, [todayKey]);

  // Persist changes during the day (so user progress stays)
  useEffect(() => {
    if (bootLoading) return;
    try {
      localStorage.setItem("joyDailySeed", JSON.stringify({ date: todayKey, items: tasks }));
    } catch {}
  }, [tasks, todayKey, bootLoading]);

  function toggle(id: string) {
    setTasks(ts => ts.map(t => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function addTask() {
    const title = input.trim();
    if (!title) return;
    setTasks(ts => [{ id: crypto.randomUUID(), title }, ...ts]);
    setInput("");
  }

  async function generateAI() {
    if (aiLoading) return;
    setAiLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 1, existing: tasks.map(t => t.title) }),
      });
      const data = await res.json();
      const text = Array.isArray(data?.items) ? data.items[0] : data?.text;
      if (!res.ok || !text) throw new Error(data?.error || "No suggestion");
      setTasks(ts => [{ id: crypto.randomUUID(), title: text }, ...ts]);
    } catch (e: any) {
      setMsg(e?.message || "AI suggestion failed");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🎉 Joy Challenge</h1>
      <p className="text-sm text-white/80">
        Three AI-generated simple challenges to do during hangouts. Add your own or generate more!
      </p>

      {/* Input + buttons */}
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Add your own challenge..."
          className="min-w-[220px] flex-1 rounded-lg text-sm p-2 bg-white/90 text-[var(--ink)]"
        />
        <button
          onClick={addTask}
          className="rounded-lg px-3 py-2 bg-[var(--mauve)] text-white hover:bg-[var(--mauve)]/70"
        >
          Add
        </button>
        <button
          onClick={generateAI}
          disabled={aiLoading}
          className="rounded-lg px-3 py-2 border border-white/40 hover:bg-white/10 disabled:opacity-60"
        >
          {aiLoading ? "Generating…" : "Generate with AI"}
        </button>
      </div>

      {msg && <p className="text-sm text-red-300">{msg}</p>}

      {/* Initial loading state */}
      {bootLoading ? (
        <p className="text-sm text-white/70">Generating today’s joys…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-white/70">No tasks yet. Try “Generate with AI”.</p>
      ) : (
        <div className="space-y-4">
          {tasks.map(t => (
            <div
              key={t.id}
              className="flex text-black items-center justify-between rounded-xl bg-[var(--cream)]/90 p-4 shadow"
            >
              <div>
                <p className={`font-medium ${t.done ? "line-through opacity-60" : ""}`}>
                  {t.title}
                </p>
                {t.location && (
                  <p className="text-xs mt-1 opacity-70">Location: {t.location}</p>
                )}
              </div>
              <button
                onClick={() => toggle(t.id)}
                className={`rounded-lg px-3 py-1 text-sm ${
                  t.done ? "bg-white border" : "bg-[var(--mauve)] text-white"
                }`}
              >
                {t.done ? "Completed ✓" : "Mark done"}
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}