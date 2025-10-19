"use client";
import { useEffect, useMemo, useState } from "react";

type JoyTask = {
  id: string;
  title: string;
  done?: boolean;
};

export default function JoyPage() {
  const [tasks, setTasks] = useState<JoyTask[]>([]);
  const [input, setInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  // Unique daily key → regenerates once per day
  const todayKey = useMemo(() => new Date().toDateString(), []);

  // Load or generate today's tasks
  useEffect(() => {
    const saved = localStorage.getItem("joyDailySeed");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as { date: string; items: JoyTask[] };
        if (parsed.date === todayKey && parsed.items?.length) {
          setTasks(parsed.items);
          setBootLoading(false);
          return;
        }
      } catch {}
    }
    generateDefaultTasks(); // fallback to fresh generation
  }, [todayKey]);

  // Persist to localStorage whenever tasks change
  useEffect(() => {
    if (bootLoading) return;
    localStorage.setItem("joyDailySeed", JSON.stringify({ date: todayKey, items: tasks }));
  }, [tasks, todayKey, bootLoading]);

  async function generateDefaultTasks() {
    setBootLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count: 3, existing: [] }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data?.items))
        throw new Error(data?.error || "AI generation failed");

      const items: JoyTask[] = data.items.map((title: string) => ({
        id: crypto.randomUUID(),
        title,
        done: false,
      }));

      setTasks(items);
      localStorage.setItem("joyDailySeed", JSON.stringify({ date: todayKey, items }));
    } catch (e: any) {
      setMsg(e?.message || "Failed to auto-generate joys");
      setTasks([]);
    } finally {
      setBootLoading(false);
    }
  }

  function toggle(id: string) {
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));
  }

  function addTask() {
    const title = input.trim();
    if (!title) return;
    setTasks((ts) => [{ id: crypto.randomUUID(), title, done: false }, ...ts]);
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
        body: JSON.stringify({ count: 1, existing: tasks.map((t) => t.title) }),
      });
      const data = await res.json();
      const text = Array.isArray(data?.items) ? data.items[0] : data?.text;
      if (!text) throw new Error("No suggestion returned");
      setTasks((ts) => [{ id: crypto.randomUUID(), title: text, done: false }, ...ts]);
    } catch (e: any) {
      setMsg(e?.message || "AI suggestion failed");
    } finally {
      setAiLoading(false);
    }
  }

  // 🔹 Reset button — clears cache and regenerates 3 AI tasks
  async function resetToday() {
    localStorage.removeItem("joyDailySeed");
    setTasks([]);
    await generateDefaultTasks();
  }

  return (
    <main className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">🎉 Joy Challenge</h1>
        <button
          onClick={resetToday}
          className="text-sm border px-3 py-1 rounded hover:bg-white/10"
        >
          Reset
        </button>
      </div>
      <p className="text-sm text-primary/80">
        Three AI-generated mini challenges for today. Add your own or generate more!
      </p>

      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
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

      {bootLoading ? (
        <p className="text-sm text-white/70">Generating today’s joys…</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-white/70">No tasks yet. Try “Generate with AI”.</p>
      ) : (
        <div className="space-y-4">
          {tasks.map((t) => (
            <div
              key={t.id}
              className="flex text-black items-center justify-between rounded-xl bg-[var(--cream)]/90 p-4 shadow"
            >
              <p className={`font-medium ${t.done ? "line-through opacity-60" : ""}`}>
                {t.title}
              </p>
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