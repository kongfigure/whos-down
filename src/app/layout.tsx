// src/app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactNode } from "react";
import NavTabs from "../components/NavTabs"; // ← client nav
import Script from "next/script"; 

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Who's Down?",
  description: "Bring Joyful Interactions -- Dubhacks 2025",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen
                    bg-[var(--sage)] text-[var(--ink)]`}
      >
        <header className="py-5">
          <h1 className="text-center text-xl font-semibold">Bring Joy</h1>
        </header>

        <nav className="mx-auto max-w-5xl mb-6">
          <NavTabs />
        </nav>

        <Script
          src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`}
          strategy="afterInteractive"
        />

        <main className="mx-auto max-w-5xl px-5 pb-16">{children}</main>
      </body>
    </html>
  );
}

