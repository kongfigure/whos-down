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
  collection,
  doc,
  onSnapshot,
  orderBy,
  serverTimestamp,
  updateDoc,
  arrayUnion,
  setDoc,
  getDoc,
  query,
} from "firebase/firestore";

interface Post {
  id?: string;
  userId?: string;
  userName: string;
  userPhoto?: string | null;
  text: string;
  createdAt?: any;
  participants?: string[];
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newPost, setNewPost] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const postList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Post),
      }));
      setPosts(postList);
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

  async function handleAddPost() {
    if (!user || !newPost.trim()) return;

    await addDoc(collection(db, "posts"), {
      userId: user.uid,
      userName: user.displayName ?? user.email,
      userPhoto: user.photoURL ?? null,
      text: newPost,
      participants: [],
      createdAt: serverTimestamp(),
    });
    setNewPost("");
    setShowForm(false);
  }

  async function handleImDown(post: Post) {
    if (!user) {
      alert("Please sign in first!");
      return;
    }
    if (!post.id || post.userId === user.uid) {
      alert("You cannot join your own post!");
      return;
    }

    const postRef = doc(db, "posts", post.id);
    await updateDoc(postRef, { participants: arrayUnion(user.uid) });

    const chatId = [post.userId, user.uid].sort().join("_");
    const chatRef = doc(db, "chats", chatId);
    const chatSnap = await getDoc(chatRef);

    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        users: [post.userId, user.uid],
        messages: [],
        createdAt: serverTimestamp(),
        lastMessage: `${user.displayName} is down for "${post.text}"`,
      });
    } else {
      await updateDoc(chatRef, {
        lastMessage: `${user.displayName} is down for "${post.text}"`,
        updatedAt: serverTimestamp(),
      });
    }

    alert(`You are down for "${post.text}"! Chat room ready.`);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 bg-[var(--cream)]/40">
      <h1 className="text-3xl font-bold">Who’s Down</h1>

      {user ? (
        <>
          <p>Hi, {user.displayName ?? user.email} 👋</p>
          <button
            className="border rounded px-4 py-2"
            onClick={handleSignOut}
          >
            Sign out
          </button>

          <div className="mt-6 w-full max-w-2xl space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xl font-semibold">Community Posts</p>
              <button
                className="bg-rose-300 text-white px-3 py-1 rounded-full"
                onClick={() => setShowForm((p) => !p)}
              >
                ＋
              </button>
            </div>

            {showForm && (
              <div className="bg-white p-4 rounded-lg shadow-md space-y-2">
                <textarea
                  className="w-full border rounded p-2"
                  rows={2}
                  placeholder='Ex: "Down for coffee @ HUB?"'
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                />
                <button
                  className="bg-rose-400 text-white px-4 py-2 rounded w-full"
                  onClick={handleAddPost}
                >
                  Add Post
                </button>
              </div>
            )}

            <div className="space-y-3">
              {posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-lg shadow-md p-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    {post.userPhoto ? (
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
                    onClick={() => handleImDown(post)}
                    className="bg-green-300 px-3 py-1 rounded-full hover:bg-green-400"
                  >
                    I’m Down
                  </button>
                </div>
              ))}
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
