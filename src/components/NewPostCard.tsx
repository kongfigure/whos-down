"use client";
import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

type Draft = {
  title: string;
  location?: string;
  time?: string;
  spots?: number | "";
};

const TITLE_CHIPS = [
  "Coffee & co-working",
  "Study session",
  "Evening walk",
  "Boba run",
  "Board games",
];

const LOCATION_CHIPS = ["Odegaard", "Cafe Allegro", "The Ave", "HUB", "Green Lake"];

export default function NewPostCard() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [d, setD] = useState<Draft>({
    title: "",
    location: "",
    time: "",
    spots: "",
  });

  function reset() {
    setD({ title: "", location: "", time: "", spots: "" });
    setOpen(false);
    setMsg(null);
    setBusy(false);
  }

  function applyChip(field: keyof Draft, value: string) {
    setD((x) => ({ ...x, [field]: value }));
  }

  async function submit() {
    const title = d.title.trim();
    if (!title) {
      setMsg("Please add a short title.");
      return;
    }

    setBusy(true);
    setMsg(null);

    const u = auth.currentUser;
    try {
      await addDoc(collection(db, "posts"), {
        title,
        location: d.location?.trim() || null,
        time: d.time?.trim() || null,
        spots:
          typeof d.spots === "number"
            ? d.spots
            : (typeof d.spots === "string" && d.spots !== "" ? Number(d.spots) : null),
        // author info
        authorId: u?.uid || null,
        authorName: u?.displayName || u?.email || "Anonymous",
        authorPhotoURL: u?.photoURL || null,
        createdAt: serverTimestamp(),
      });
      reset();
    } catch (e: any) {
      setBusy(false);
      setMsg(e?.message || "Could not post. Try again.");
    }
  }

  // Collapsed state – a single button
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl bg-white/10 hover:bg-white/15 transition p-4 text-left"
      >
        <span className="opacity-80">Start a post…</span>
      </button>
    );
  }

  // Expanded composer
  return (
    <div className="rounded-2xl bg-white/10 p-4 space-y-4">
      <div>
        <label className="block text-sm opacity-80 mb-1">Title*</label>
        <input
          value={d.title}
          onChange={(e) => setD((x) => ({ ...x, title: e.target.value }))}
          placeholder='e.g., "Coffee & co-working"'
          className="w-full rounded-lg bg-white/90 text-[var(--ink)] px-3 py-2"
        />
        <div className="flex flex-wrap gap-2 mt-2">
          {TITLE_CHIPS.map((c) => (
            <button
              key={c}
              onClick={() => applyChip("title", c)}
              className="rounded-full px-3 py-1 text-sm bg-white/15 hover:bg-white/25"
              type="button"
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm opacity-80 mb-1">Location (optional)</label>
          <input
            value={d.location}
            onChange={(e) => setD((x) => ({ ...x, location: e.target.value }))}
            placeholder="Where?"
            className="w-full rounded-lg bg-white/90 text-[var(--ink)] px-3 py-2"
          />
          <div className="flex flex-wrap gap-2 mt-2">
            {LOCATION_CHIPS.map((c) => (
              <button
                key={c}
                onClick={() => applyChip("location", c)}
                className="rounded-full px-3 py-1 text-sm bg-white/15 hover:bg-white/25"
                type="button"
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm opacity-80 mb-1">Time (optional)</label>
          <input
            value={d.time}
            onChange={(e) => setD((x) => ({ ...x, time: e.target.value }))}
            placeholder="Today 6:00pm"
            className="w-full rounded-lg bg-white/90 text-[var(--ink)] px-3 py-2"
          />
        </div>

        <div>
          <label className="block text-sm opacity-80 mb-1">Spots (optional)</label>
          <input
            type="number"
            min={1}
            value={d.spots}
            onChange={(e) => setD((x) => ({ ...x, spots: e.target.value as any }))}
            placeholder="2"
            className="w-full rounded-lg bg-white/90 text-[var(--ink)] px-3 py-2"
          />
        </div>
      </div>

      {msg && <div className="text-sm text-red-300">{msg}</div>}

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={busy}
          className="rounded-lg px-4 py-2 bg-[var(--mauve)] text-white hover:bg-[var(--mauve)]/85 disabled:opacity-60"
        >
          {busy ? "Posting…" : "Post invite"}
        </button>
        <button
          onClick={reset}
          className="rounded-lg px-4 py-2 border border-white/30 hover:bg-white/10"
          type="button"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}