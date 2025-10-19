'use client';

import React from 'react';

interface ChatMessage {
  id: number;
  name: string;
  content: string;
  photoURL?: string;
}

interface PostFeedProps {
  messages: ChatMessage[];
}

export default function PostFeed({ messages }: PostFeedProps) {
  return (
    <div className="flex-1 overflow-y-auto mb-4 space-y-2">
      {messages.map((msg) => (
        <div key={msg.id} className="flex items-start gap-2 bg-white/20 p-2 rounded-xl">
    {msg.photoURL ? (
      <img
        src={msg.photoURL}
        alt={msg.name}
        className="w-10 h-10 rounded-full object-cover"
      />
    ) : (
      <div className="w-10 h-10 rounded-full bg-yellow-300 flex items-center justify-center font-semibold text-white">
        {msg.name.charAt(0).toUpperCase()}
      </div>
    )}

    <div className="flex flex-col">
      <span className="font-semibold">{msg.name}</span>
      <span>{msg.content}</span>
    </div>
  </div>
      ))}
      {messages.length === 0 && <div className="text-gray-400">Chat Feed</div>}
    </div>
  );
}
