"use client";

import { useEffect, useState } from "react";
import NewFeed from "@/components/chat/NewFeed";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, type User } from "firebase/auth";

/** Local message shape (simple for demo) */
type ChatMessage = {
  id: number;
  name: string;
  content: string;
};

export default function ChatPage() {
  const [user, setUser] = useState<User | null>(null);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    // Seed a couple so the feed isn't empty
    { id: 1, name: "Ava L.", content: "Hey! Anyone down for boba at 7?" },
    { id: 2, name: "Ben P.", content: "Study break at Odegaard? :)" },
  ]);

  // Keep auth state in sync (uses shared firebase instance)
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  function handleSend() {
    if (!user) {
      alert("Please sign in to send messages.");
      return;
    }
    const text = message.trim();
    if (!text) return;

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: user.displayName || user.email || "Anonymous",
        content: text,
      },
    ]);
    setMessage("");
  }

  return (
    <div className="flex min-h-screen flex-col gap-4 p-6">
      <header className="mb-2">
        <h1 className="text-2xl font-semibold">Chat</h1>
        <p className="text-sm opacity-80">
          {user ? `Signed in as ${user.displayName ?? user.email}` : "Not signed in"}
        </p>
      </header>

      {/* People you may know — teammate's section, kept */}
      <section className="rounded-xl bg-white/10 p-4">
        <div className="mb-3 font-medium">People you may know</div>
        <div className="text-sm opacity-80">Coming soon…</div>
      </section>

      {/* Chat feed — teammate's NewFeed component, kept */}
      <section className="flex-1 overflow-y-auto rounded-xl bg-white/10 p-4">
        <div className="mb-3 text-sm opacity-80">Chat Feed</div>
        <NewFeed messages={messages} />
      </section>

      {/* Composer */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={user ? "Type a message…" : "Sign in to chat"}
          disabled={!user}
          className="flex-1 rounded-full border border-white/30 bg-transparent px-4 py-2 outline-none focus:ring-2 focus:ring-[var(--mauve)] disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!user || !message.trim()}
          className="rounded-full bg-[var(--mauve)] px-4 py-2 font-semibold text-white hover:bg-[var(--mauve)]/80 disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </div>
  );
}