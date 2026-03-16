"use client";

import { useEffect, useState } from "react";
import { Film } from "lucide-react";
import { seedFilms } from "@/lib/seed-data";

interface FilmData {
  id: string;
  name: string;
  brand: string;
  iso: number;
  format: string;
  type: string;
  count?: number;
  is_bulk_film?: boolean;
}

export function DemoFilmsContent() {
  const [films, setFilms] = useState<FilmData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use seed data directly for the demo panel
    // This avoids needing the database for the landing page preview
    setFilms(seedFilms as FilmData[]);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const totalRolls = films.reduce((sum, f) => sum + (f.count || 0), 0);
  const colorFilms = films.filter(
    (f) => f.type === "Color Negative" || f.type === "Slide"
  );
  const bwFilms = films.filter((f) => f.type === "Black & White");

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Total Rolls" value={totalRolls} />
        <StatCard label="Color" value={colorFilms.length} />
        <StatCard label="B&W" value={bwFilms.length} />
      </div>

      {/* Film List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {films.map((film) => (
          <FilmCard key={film.id} film={film} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-lg bg-[#1a1614] border border-[#2a2420]">
      <div className="text-xl text-[#e8e4e0] font-light">{value}</div>
      <div className="text-xs text-[#6a6460]">{label}</div>
    </div>
  );
}

function FilmCard({ film }: { film: FilmData }) {
  const typeColor =
    film.type === "Color Negative"
      ? "bg-amber-500"
      : film.type === "Black & White"
        ? "bg-zinc-400"
        : film.type === "Slide"
          ? "bg-emerald-500"
          : "bg-violet-500";

  return (
    <div className="p-3 rounded-lg bg-gradient-to-br from-zinc-500/10 to-zinc-600/5 border border-[#2a2420] hover:border-[#3a3430] transition-colors">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Film className="w-4 h-4 text-[#6a6460]" />
          <span
            className="text-[#e8e4e0] text-sm"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {film.name}
          </span>
        </div>
        <span className={`w-2 h-2 rounded-full ${typeColor}`} />
      </div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-[#6a6460]">
          {film.brand} · ISO {film.iso} · {film.format}
        </span>
        <span className="text-[#8a8078]">
          {film.count} {film.is_bulk_film ? "bulk" : "rolls"}
        </span>
      </div>
    </div>
  );
}
