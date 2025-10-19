// src/components/NavTabs.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/", label: "Community" },
  { href: "/chat", label: "Chat" },
  { href: "/hangouts", label: "Hangouts" },
  { href: "/joy", label: "Joy Challenge" },
];

export default function NavTabs() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/"
      : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="rounded-2xl bg-[var(--mauve)]/90 px-3 py-2 flex gap-4 justify-center text-white">
      {tabs.map(t => {
        const active = isActive(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-xl px-4 py-2 transition-colors
              ${active ? "bg-white/20 font-semibold" : "hover:bg-white/15"}`}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}