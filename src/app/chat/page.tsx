"use client";

import { useEffect, useState } from "react";
import NewFeed from "@/components/chat/NewFeed";
import { auth } from "@/lib/firebase"; // ✅ use the initialized auth
import { onAuthStateChanged, type User } from "firebase/auth";

type ChatMessage = {
  id: number;
  name: string;
  content: string;
};

export default function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsub();
  }, []);

  function handleSend() {
    if (!user) {
      alert("Please log in to send messages.");
      return;
    }
    const text = message.trim();
    if (!text) return;

    const msg: ChatMessage = {
      id: Date.now(),
      name: user.displayName || user.email || "Anonymous",
      content: text,
    };

    setMessages((prev) => [...prev, msg]);
    setMessage("");
  }

  return (
    <div className="flex flex-col min-h-screen space-y-6 p-6 bg-[var(--cream)]/80 rounded-lg">
        {/* Section 1: People you may know */}
        <div>
        <div className="mt-5 mb-5 font-bold text-lg">
            People you may know
        </div>
        <div className="mt-5 mb-5 text-sm">Coming soon...</div>
        </div>

        {/* Section 2: Chat Feed */}
        <div className="flex flex-col flex-1 bg-white/50 rounded-lg p-4">
        {/* Messages list */}
        <div className="flex-1 overflow-y-auto mb-4">
            <NewFeed messages={messages} />
        </div>

        {/* Composer */}
        <div className="flex items-center gap-2">
            <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[var(--mauve)]"
            />
            <button
            onClick={handleSend}
            className="px-4 py-2 bg-[var(--mauve)] text-white rounded-full font-semibold hover:bg-purple-700"
            >
            Send
            </button>
        </div>
        </div>
    </div>
    );
}