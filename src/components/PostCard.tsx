"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
  arrayUnion,
  doc,
  getDoc,
  onSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

type Post = {
  id: string;
  title?: string;
  location?: string;
  spots?: number;
  time?: string;
  authorId?: string;
  authorName?: string;
  authorPhotoURL?: string;
};

type Room = {
  name?: string;
  groupName?: string;
  memberIds?: string[];
  memberNames?: string[];
};

export default function PostCard({ post }: { post: Post }) {
  if (!post) return null;

  const router = useRouter();
  const title = post.title ?? "(untitled)";
  const groupName = `${title} Group`;
  const [room, setRoom] = useState<Room | null>(null);

  // Subscribe to room document
  useEffect(() => {
    if (!post.id) return;
    const ref = doc(db, "rooms", post.id);
    const unsub = onSnapshot(ref, (snap) => {
      setRoom(snap.exists() ? (snap.data() as Room) : null);
    });
    return () => unsub();
  }, [post.id]);

  async function imDown() {
    const user = auth.currentUser;
    const myName = user?.displayName || user?.email || "Anonymous";
    const roomRef = doc(db, "rooms", post.id);
    const snap = await getDoc(roomRef);

    if (!snap.exists()) {
      await setDoc(roomRef, {
        name: title,
        groupName,
        createdAt: serverTimestamp(),
        memberIds: user ? [user.uid] : [],
        memberNames: user ? [myName] : [],
      });
    } else if (user) {
      await updateDoc(roomRef, {
        memberIds: arrayUnion(user.uid),
        memberNames: arrayUnion(myName),
        groupName,
      }).catch(() => {});
    }

    router.push(`/chat?room=${encodeURIComponent(post.id)}`);
  }

  const members = room?.memberNames ?? [];
  const memberLabel =
    members.length > 0 ? members.join(", ") : "No one yet — be the first!";

  return (
    <div className="rounded-2xl bg-white/10 p-5 text-white">
      {/* Author */}
      <div className="flex items-center gap-3 mb-3">
        {post.authorPhotoURL ? (
          <img
            src={post.authorPhotoURL}
            alt={post.authorName || "Author"}
            className="h-9 w-9 rounded-full object-cover"
          />
        ) : (
          <div className="h-9 w-9 rounded-full bg-white/20 grid place-items-center text-sm">
            {(post.authorName || "U")[0]}
          </div>
        )}
        <div className="leading-tight">
          <div className="text-sm opacity-80">Posted by</div>
          <div className="text-sm font-medium">{post.authorName ?? "Unknown"}</div>
        </div>
      </div>

      {/* Title */}
      <div className="space-y-1 mb-4">
        <div className="font-semibold text-lg">{title}</div>
        {post.location && (
          <div className="text-sm opacity-85">📍 {post.location}</div>
        )}
        {(post.time || typeof post.spots === "number") && (
          <div className="text-sm opacity-85">
            {post.time ? `🕒 ${post.time}` : ""}
            {post.time && typeof post.spots === "number" ? " · " : ""}
            {typeof post.spots === "number" ? `👥 ${post.spots} spots` : ""}
          </div>
        )}
      </div>

      {/* Group info */}
      <div className="mb-3">
        <div className="text-xs uppercase tracking-wide opacity-70 mb-1">
          Group Name
        </div>
        <div className="text-sm font-medium">{room?.groupName ?? groupName}</div>

        <div className="text-xs uppercase tracking-wide opacity-70 mt-3 mb-1">
          Members
        </div>
        <div className="text-sm">{memberLabel}</div>
      </div>

      {/* Button */}
      <button
        onClick={imDown}
        className="mt-2 rounded-lg px-4 py-2 bg-[var(--mauve)] text-white hover:bg-[var(--mauve)]/85"
      >
        I’m down
      </button>
    </div>
  );
}