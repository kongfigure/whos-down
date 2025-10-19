"use client";

import { useEffect, useState } from "react";
import { auth, db, provider } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import {
  addDoc,
  arrayUnion,
  arrayRemove,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";

type Post = {
  id?: string;
  userId?: string;
  userName: string;
  userPhoto?: string | null;
  text: string;
  createdAt?: any;
  participants?: string[];
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [posts, setPosts] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState("");

  // auth state
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // posts live query
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(
        (d) => ({ id: d.id, ...(d.data() as any) }) as Post
      );
      setPosts(list);
    });
    return () => unsub();
  }, []);

  async function handleSignIn() {
    if (loading) return;
    setLoading(true);
    setMsg(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      if (
        e?.code !== "auth/cancelled-popup-request" &&
        e?.code !== "auth/popup-closed-by-user"
      ) {
        setMsg(e?.message ?? "Sign-in failed");
      }
      if (e?.code === "auth/popup-blocked") {
        await signInWithRedirect(auth, provider);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
  }

  // create a post
  async function handleAddPost() {
    if (!user) {
      alert("Please sign in first!");
      return;
    }
    const text = newPost.trim();
    if (!text) return;

    await addDoc(collection(db, "posts"), {
      userId: user.uid,
      userName: user.displayName ?? user.email,
      userPhoto: user.photoURL ?? null,
      text,
      participants: [],
      createdAt: serverTimestamp(),
    });

    setNewPost("");
    setShowForm(false);
  }

  // Toggle join/leave
  async function handleToggleJoin(post: Post) {
    if (!user) {
      alert("Please sign in first!");
      return;
    }
    if (!post.id || !post.userId) return;
    if (post.userId === user.uid) {
      alert("You can’t join your own post 🙂");
      return;
    }

    const joined = post.participants?.includes(user.uid) ?? false;
    const postRef = doc(db, "posts", post.id);

    // optimistic update
    setPosts((prev) =>
      prev.map((p) =>
        p.id === post.id
          ? {
              ...p,
              participants: joined
                ? (p.participants ?? []).filter((id) => id !== user.uid)
                : [...(p.participants ?? []), user.uid],
            }
          : p
      )
    );

    try {
      if (joined) {
        // LEAVE
        await updateDoc(postRef, { participants: arrayRemove(user.uid) });
        // optional: update chat or cleanup here
      } else {
        // JOIN
        await updateDoc(postRef, { participants: arrayUnion(user.uid) });

        // upsert chat without reading (rules-friendly)
        const chatId = [post.userId, user.uid].sort().join("_");
        const chatRef = doc(db, "chats", chatId);
        await setDoc(
          chatRef,
          {
            users: [post.userId, user.uid],
            lastMessage: `${user.displayName ?? "Someone"} is down for "${post.text}"`,
            createdAt: serverTimestamp(), // ignored if exists (merge)
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (e) {
      // rollback optimistic update on failure
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                participants: joined
                  ? [...(p.participants ?? []), user.uid] // we removed locally; add back
                  : (p.participants ?? []).filter((id) => id !== user.uid), // we added locally; remove
              }
            : p
        )
      );
      console.error(e);
      alert("Could not update. Please try again.");
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center gap-4 p-6 bg-[var(--sage)]/60 text-[var(--ink)]">
      <h1 className="text-3xl font-bold">Who’s Down</h1>

      {user ? (
        <>
          <div className="text-sm opacity-80">
            Hi, {user.displayName ?? user.email} 👋
          </div>
          <button className="border rounded px-4 py-2" onClick={handleSignOut}>
            Sign out
          </button>

          <div className="mt-6 w-full max-w-2xl space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xl font-semibold">Community Posts</p>
              <button
                className="bg-[var(--mauve)] text-white px-3 py-1 rounded-full"
                onClick={() => setShowForm((p) => !p)}
              >
                ＋
              </button>
            </div>

            {showForm && (
              <div className="bg-white p-4 rounded-lg shadow-md space-y-2 text-black">
                <textarea
                  className="w-full border rounded p-2"
                  rows={2}
                  placeholder='Ex: "Down for coffee @ HUB?"'
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                />
                <button
                  className="bg-[var(--mauve)] text-white px-4 py-2 rounded w-full"
                  onClick={handleAddPost}
                >
                  Add Post
                </button>
              </div>
            )}

            <div className="space-y-3">
              {posts.map((post) => {
                const joined = !!user && !!post.participants?.includes(user.uid);
                return (
                  <div
                    key={post.id}
                    className="bg-white rounded-lg shadow-md p-3 flex items-center justify-between text-black"
                  >
                    <div className="flex items-center gap-3">
                      {post.userPhoto ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={post.userPhoto}
                          alt="profile"
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-yellow-200 rounded-full" />
                      )}
                      <div>
                        <p className="font-semibold">{post.userName}</p>
                        <p className="text-gray-700">{post.text}</p>
                        {post.participants && post.participants.length > 0 && (
                          <p className="text-sm text-gray-500">
                            Participants: {post.participants.length}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleJoin(post)}
                      className={`px-3 py-1 rounded-full ${
                        joined
                          ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
                          : "bg-green-300 hover:bg-green-400 text-black"
                      }`}
                    >
                      {joined ? "Leave" : "I’m Down"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      ) : (
        <button
          className="border rounded px-4 py-2 disabled:opacity-50"
          disabled={loading}
          onClick={handleSignIn}
        >
          {loading ? "Signing in…" : "Sign in with Google"}
        </button>
      )}

      {msg && <p className="text-red-600 text-sm">{msg}</p>}
    </main>
  );
}