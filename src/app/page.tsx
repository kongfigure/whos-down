"use client";
import { useEffect, useState } from "react";
import { auth, provider } from "@/lib/firebase";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function handleSignIn() {
    if (loading) return; // prevent double clicks
    setLoading(true);
    setMsg(null);
    try {
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      // Ignore the two noisy cases
      if (
        e?.code !== "auth/cancelled-popup-request" &&
        e?.code !== "auth/popup-closed-by-user"
      ) {
        setMsg(e?.message ?? "Sign-in failed");
      }
      // Optional: Safari/iOS fallback (popups often blocked)
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

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 p-6">
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