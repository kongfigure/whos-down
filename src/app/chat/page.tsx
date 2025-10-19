'use client';

import React, { useState, useEffect } from 'react';
import NewFeed from '@/components/chat/NewFeed';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';

interface ChatMessage {
  id: number;
  name: string;
  content: string;
}

function ChatPage() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  const handleSend = () => {
    if (!user) {
      alert("Please log in to send messages.");
      return;
    }
    if (message.trim() === "") return;

    const newMessage: ChatMessage = {
      id: Date.now(),
      name: user.displayName || "Anonymous",
      content: message,
    };

  const handleSend = () => {
    if (message.trim() === "") return;
    console.log("Send message:", message);
    setMessage("");
  };

  const messageToSend: ChatMessage = {
      id: Date.now(),
      name: user.displayName || "Anonymous",
      content: message,
    };

    setMessages([...messages, messageToSend]);
    setMessage("");
  };

  return (
    <div className="flex flex-col min-h-screen p-6 bg-[var(--cream)]/40 rounded-lg">
      <div className="mt-5 mb-5 font-bold text-lg">
        People you may know or who have
      </div>
      <div className="flex-1 overflow-y-auto mb-4">
        Chat Feed
      </div>
      <NewFeed messages={messages} />

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
  )
}

export default ChatPage