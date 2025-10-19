// src/app/api/gemini/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import type { NextRequest } from "next/server";

const API_KEY = process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

// Try several widely available v1 models in order
const MODELS = [
  "gemini-2.5-flash",     // newest, fast
  "gemini-1.5-flash-8b",  // common fallback
  "gemini-1.0-pro",       // legacy fallback
];

async function generateViaREST(prompt: string, model: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await res.json();

  if (!res.ok) {
    const msg =
      json?.error?.message ||
      `HTTP ${res.status} ${res.statusText} for model ${model}`;
    throw new Error(msg);
  }

  // Extract plain text safely
  const text: string =
    json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim?.() ?? "";

  return text;
}

export async function POST(req: NextRequest) {
  try {
    if (!API_KEY) {
      return Response.json(
        { error: "Missing GOOGLE_API_KEY or GEMINI_API_KEY" },
        { status: 500 }
      );
    }

    // Parse body with guards
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const existing: string[] = Array.isArray(body?.existing) ? body.existing : [];
    const count: number = Math.min(Math.max(Number(body?.count) || 1, 1), 5);
    const mood: string | undefined =
      typeof body?.mood === "string" ? body.mood : undefined;

    const prompt = `
You help college students spark small moments of joy.
Return ${count} SHORT, actionable, inclusive challenges. Max ~12 words each.
Avoid duplicates of: ${existing.join(" | ") || "(none)"}
If mood is provided, tailor tone slightly. Mood: ${mood ?? "unknown"}

FORMAT STRICTLY:
- One challenge per line
- No numbering, no bullets, no quotes, no extra commentary
`;

    // Try models until one works
    let lastErr: unknown = null;

    for (const name of MODELS) {
      try {
        const text = await generateViaREST(prompt, name);
        if (!text) throw new Error(`Empty response from ${name}`);

        // ⬇️ Type-safe parsing of lines (fixes your red underline)
        const lines = (text || "")
          .split("\n")
          .map((s: string) => s.replace(/^\W+/, "").trim())
          .filter(Boolean);

        // Deduplicate and cap to requested count
        const unique: string[] = [];
        for (const l of lines) {
          if (!unique.includes(l)) unique.push(l);
          if (unique.length >= count) break;
        }

        if (unique.length > 0) {
          return Response.json(
            { items: unique.slice(0, count), model: name },
            { status: 200 }
          );
        }

        lastErr = new Error(`No usable lines from ${name}`);
      } catch (e) {
        lastErr = e;
        // Try the next model
      }
    }

    return Response.json(
      { error: `All models failed: ${String((lastErr as any)?.message || lastErr)}` },
      { status: 502 }
    );
  } catch (e: any) {
    return Response.json(
      { error: e?.message || "Failed to generate" },
      { status: 500 }
    );
  }
}