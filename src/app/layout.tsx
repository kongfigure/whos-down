import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Link from "next/link";
import {ReactNode} from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Who's Down?",
  description: "Bring Joyful Interactions -- Dubhacks 2025",
};

export default function RootLayout({
  children
}: { 
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="py-5">
          <h1 className="text-center text-xl font-semibold">Bring Joy</h1>
        </header>

        <nav className="py-5">
          <div className="rounded-2xl bg-[var(--mauve)]/80 px-3 py-2 flex gap-4 justify-center text-white">
            <a href="/" className="rounded-xl px-4 py-2 hover:bg-white/15">Community</a>
            <a href="/chat" className="rounded-xl px-4 py-2 hover:bg-white/15">Chat</a>
            <a href="/hangouts" className="rounded-xl px-4 py-2 hover:bg-white/15">Hangouts</a>
            <a href="/joy" className="rounded-xl px-4 py-2 hover:bg-white/15">Joy Challenge</a>
          </div>
        </nav>

        <main className="mx-auto max-w-5xl px-5 pb-16">{children}</main>
      </body>
    </html>
  );
}
