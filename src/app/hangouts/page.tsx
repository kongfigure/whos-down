"use client";
import { useEffect, useState } from "react";

type PlaceItem = {
  id: string;           // place_id
  name: string;
  rating?: number;
  ratingsTotal?: number;
  vicinity?: string;
};

const FILTERS = [
  { key: "all", label: "All" },
  { key: "cafe", label: "Cafes" },
  { key: "library", label: "Libraries" },
  { key: "park", label: "Parks" },
  { key: "study", label: "Study" }, // uses keyword "study"
] as const;

export default function HangoutsPage() {
  const [places, setPlaces] = useState<PlaceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] =
    useState<(typeof FILTERS)[number]["key"]>("all");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    fetchNearby(selected);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  function fetchNearby(filter: (typeof FILTERS)[number]["key"]) {
    // @ts-ignore
    const g = (globalThis as any).google;
    if (!g?.maps?.places) return;

    if (!navigator.geolocation) {
      setErr("Location permission needed.");
      return;
    }

    setLoading(true);
    setErr(null);
    setPlaces([]);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = new g.maps.LatLng(
          pos.coords.latitude,
          pos.coords.longitude
        );
        const svc = new g.maps.places.PlacesService(
          document.createElement("div")
        );

        // Build request (typed as any for simplicity)
        const req: any = {
          location: loc,
          radius: 2000, // meters
        };

        // Use a single string for type; 'study' uses keyword
        if (filter !== "all") {
          if (filter === "study") {
            req.keyword = "study space";
          } else {
            req.type = filter; // "cafe" | "library" | "park"
          }
        }

        // Nearby search
        svc.nearbySearch(req as any, (results: any[], status: any) => {
          setLoading(false);

          if (
            status !== g.maps.places.PlacesServiceStatus.OK ||
            !results?.length
          ) {
            // Fallback to keyword search if typed search returned nothing
            if (filter !== "all" && filter !== "study") {
              const fallbackReq: any = {
                location: loc,
                radius: 2000,
                keyword: filter, // "cafe" | "library" | "park"
              };
              svc.nearbySearch(fallbackReq, (res2: any[], st2: any) => {
                if (
                  st2 !== g.maps.places.PlacesServiceStatus.OK ||
                  !res2?.length
                ) {
                  setPlaces([]);
                  return;
                }
                setPlaces(sortMap(res2).slice(0, 12));
              });
              return;
            }
            setPlaces([]);
            return;
          }

          setPlaces(sortMap(results).slice(0, 12));
        });
      },
      (e) => {
        setLoading(false);
        setErr("Could not get your location.");
        console.error(e);
      }
    );
  }

  // Keep sortMap accepting any[] to avoid TS noise
  function sortMap(results: any[]) {
    const mapped: PlaceItem[] = results.map((r: any) => ({
      id: r.place_id!,
      name: r.name ?? "(unknown)",
      rating: r.rating,
      ratingsTotal: r.user_ratings_total,
      vicinity: r.vicinity,
    }));

    mapped.sort((a, b) => {
      const ra = a.rating ?? 0,
        rb = b.rating ?? 0;
      if (rb !== ra) return rb - ra;
      const ca = a.ratingsTotal ?? 0,
        cb = b.ratingsTotal ?? 0;
      return cb - ca;
    });

    return mapped;
  }

  function mapsLink(p: PlaceItem) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      p.name
    )}&query_place_id=${p.id}`;
  }

  return (
    <main className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Hangouts — Nearby Spots</h1>
      <p className="text-sm text-white/80">
        Pick a category to see nearby recommendations (sorted by rating).
      </p>

      {/* filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setSelected(f.key)}
            className={`rounded-full px-3 py-1 text-sm border ${
              selected === f.key ? "bg-white/20" : "hover:bg-white/10"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* results */}
      {loading && <p className="text-sm opacity-80">Finding places…</p>}
      {err && <p className="text-sm text-red-300">{err}</p>}

      {!loading && !err && places.length === 0 && (
        <p className="text-sm opacity-80">No results here. Try another filter.</p>
      )}

      <ul className="grid gap-3 sm:grid-cols-2">
        {places.map((p) => (
          <li
            key={p.id}
            className="rounded-xl bg-[var(--cream)]/90 p-4 text-black"
          >
            <div className="font-medium">{p.name}</div>
            <div className="text-sm opacity-80">
              {p.vicinity || "Nearby"} · ⭐ {p.rating ?? "—"}
              {typeof p.ratingsTotal === "number" ? ` (${p.ratingsTotal})` : ""}
            </div>
            <div className="mt-2">
              <a
                href={mapsLink(p)}
                target="_blank"
                rel="noreferrer"
                className="text-sm underline opacity-80 hover:opacity-100"
              >
                Open in Google Maps
              </a>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}