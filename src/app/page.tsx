"use client";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import PostCard from "@/components/PostCard";
import NewPostCard from "@/components/NewPostCard";

type Post = {
  id: string;
  title: string;
  location?: string;
  spots?: number;
  time?: string;
  authorId?: string;
  authorName?: string;
  authorPhotoURL?: string;
};

// Example posts (used as filler/demo)
const SEED: Post[] = [
  { id: "p1", title: "Coffee & co-working ☕️", location: "Cafe Allegro", spots: 2, time: "Today 3:30pm", authorName: "Ava L." },
  { id: "p2", title: "Evening walk 🚶‍♀️", location: "Green Lake Park", spots: 3, time: "Today 6:00pm", authorName: "Ben P." },
  { id: "p3", title: "Study CS 📚", location: "Odegaard 2F", spots: 1, time: "Tomorrow 11:00am", authorName: "Nora K." },
  { id: "p4", title: "Boba run 🧋", location: "ShareTea", spots: 4, time: "Tonight 8:00pm", authorName: "Zach S." },
];

export default function CommunityPage() {
  const [firePosts, setFirePosts] = useState<Post[]>([]);
  const [showExamples, setShowExamples] = useState(true); // <— toggle

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      const rows: Post[] = snap.docs
        .map((d) => ({ id: d.id, ...(d.data() as any) }))
        .filter((p) => typeof p.title === "string" && p.title.trim().length > 0);
      setFirePosts(rows);
    });
    return () => unsub();
  }, []);

  // Merge Firestore + SEED (avoid dup by title)
  const posts: Post[] = useMemo(() => {
    if (firePosts.length === 0) return SEED;
    if (!showExamples) return firePosts;
    const dedupSet = new Set(firePosts.map((p) => p.title.trim().toLowerCase()));
    const filler = SEED.filter((s) => !dedupSet.has(s.title.trim().toLowerCase()));
    return [...firePosts, ...filler];
  }, [firePosts, showExamples]);

  return (
    <main className="mx-auto max-w-4xl p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold">Community</h1>
        <button
          onClick={() => setShowExamples((v) => !v)}
          className="text-sm rounded-lg px-3 py-1 border border-white/30 hover:bg-white/10"
        >
          {showExamples ? "Hide examples" : "Show examples"}
        </button>
      </div>

      {/* Composer (remove if you don't use it) */}
      <NewPostCard />

      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((p) => (
          <PostCard key={p.id} post={p} />
        ))}
      </div>
    </main>
  );
}
