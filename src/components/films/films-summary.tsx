"use client";

import { useState } from "react";
import { type Film } from "@/lib/utils";
import { useCurrentDate } from "@/hooks/use-current-date";
import { Package, Film as FilmIcon, Grid3X3, Timer, Calendar, AlertTriangle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { format, differenceInDays } from "date-fns";
import Link from "next/link";
import { useDemoPrefix } from "@/lib/use-demo-prefix";

interface FilmsSummaryProps {
  films: Film[];
}

function getAvailableCount(film: Film): number {
  if (typeof film.available_count === "number" && film.available_count >= 0) {
    return film.available_count;
  }
  if (typeof film.total_count === "number" && film.total_count >= 0) {
    return film.total_count;
  }
  return film.count || 1;
}

function getTotalCount(film: Film): number {
  if (typeof film.total_count === "number" && film.total_count >= 0) {
    return film.total_count;
  }
  return film.count || 1;
}

// Get films that are expiring soon or already expired
function getExpiringFilms(films: Film[], now: Date): Film[] {
  const threeMonthsFromNow = new Date(now);
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  return films
    .filter((f) => {
      const exp = new Date(f.expiration_date);
      const count = getAvailableCount(f);
      return exp <= threeMonthsFromNow && count > 0;
    })
    .sort((a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime());
}

function getExpirationStatus(expirationDate: string, now: Date): { label: string; color: string } {
  const exp = new Date(expirationDate);
  const daysUntil = differenceInDays(exp, now);

  if (daysUntil < 0) {
    return { label: "Expired", color: "bg-red-500/20 text-red-400 border-red-500/30" };
  } else if (daysUntil <= 30) {
    return { label: "This month", color: "bg-orange-500/20 text-orange-400 border-orange-500/30" };
  } else if (daysUntil <= 90) {
    return { label: "Within 3 months", color: "bg-amber-500/20 text-amber-400 border-amber-500/30" };
  }
  return { label: "OK", color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" };
}

export function FilmsSummary({ films }: FilmsSummaryProps) {
  const prefix = useDemoPrefix();
  const [showExpiringModal, setShowExpiringModal] = useState(false);

  const now = useCurrentDate();
  const threeMonthsFromNow = new Date(now);
  threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);

  // Count rolls (not just stocks) that are expiring soon or already expired
  const expiringRolls = films.reduce((sum, f) => {
    const exp = new Date(f.expiration_date);
    const count = getAvailableCount(f);
    // Include films expiring within 3 months OR already expired
    if (exp <= threeMonthsFromNow) {
      return sum + count;
    }
    return sum;
  }, 0);

  const expiringFilms = getExpiringFilms(films, now);

  const stats = {
    totalRolls: films.reduce((sum, f) => sum + getTotalCount(f), 0),
    availableRolls: films.reduce((sum, f) => sum + getAvailableCount(f), 0),
    uniqueStocks: films.length,
    expiringSoon: expiringRolls,
  };

  const typeBreakdown = films.reduce(
    (acc, film) => {
      const count = getAvailableCount(film);
      acc[film.type] = (acc[film.type] || 0) + count;
      return acc;
    },
    {} as Record<string, number>
  );

  const statItems = [
    { label: "Total Rolls", value: stats.totalRolls, icon: Package, clickable: false },
    { label: "Available", value: stats.availableRolls, icon: FilmIcon, clickable: false },
    { label: "Film Stocks", value: stats.uniqueStocks, icon: Grid3X3, clickable: false },
    {
      label: "Expiring Soon",
      value: stats.expiringSoon,
      icon: Timer,
      alert: stats.expiringSoon > 0,
      clickable: stats.expiringSoon > 0,
      onClick: () => setShowExpiringModal(true),
    },
  ];

  const typeColors: Record<string, { bar: string; dot: string }> = {
    Color: {
      bar: "bg-gradient-to-r from-amber-500 to-orange-600",
      dot: "bg-amber-500",
    },
    "Black & White": {
      bar: "bg-gradient-to-r from-zinc-400 to-zinc-500",
      dot: "bg-zinc-400",
    },
    Slide: {
      bar: "bg-gradient-to-r from-emerald-500 to-teal-600",
      dot: "bg-emerald-500",
    },
  };

  return (
    <>
      <div className="space-y-6">
        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statItems.map((stat, i) => {
            const Icon = stat.icon;
            const isClickable = stat.clickable;
            const cardClassName = `
              relative overflow-hidden rounded-xl border p-4 text-left transition-[transform,border-color,background-color] duration-200 ease-[cubic-bezier(0.2,0,0,1)]
              ${
                stat.alert
                  ? "bg-red-900/10 border-red-800/30 hover:border-red-700/50"
                  : "bg-[#1a1614]/50 border-[#2a2420] hover:border-[#3a3430]"
              }
            `;
            const cardBody = (
              <>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="mb-1 text-xs uppercase tracking-wider text-[#8a8078]">
                      {stat.label}
                    </p>
                    <p
                      className={`text-3xl font-light tabular-nums ${stat.alert ? "text-red-400" : "text-[#e8e4e0]"}`}
                      style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <Icon
                    className={`h-5 w-5 ${stat.alert ? "text-red-500/50" : "text-[#4a4440]"}`}
                  />
                </div>
                {isClickable && (
                  <p className="mt-2 text-[10px] text-[#6a6460]">Click to view</p>
                )}
              </>
            );

            if (isClickable) {
              return (
                <button
                  key={stat.label}
                  type="button"
                  onClick={stat.onClick}
                  aria-label={`${stat.label}: ${stat.value}. Click to view details.`}
                  className={`${cardClassName} cursor-pointer hover:scale-[1.01] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
                  style={{
                    animationDelay: `${i * 50}ms`,
                  }}
                >
                  {cardBody}
                </button>
              );
            }

            return (
              <div
                key={stat.label}
                className={cardClassName}
                style={{
                  animationDelay: `${i * 50}ms`,
                }}
              >
                {cardBody}
              </div>
            );
          })}
        </div>

        {/* Distribution Bar */}
        {stats.availableRolls > 0 && (
          <div>
            <div className="flex items-center gap-4 mb-3">
              <span className="text-xs uppercase tracking-wider text-[#6a6460]">
                Distribution
              </span>
              <div className="flex-1 h-px bg-[#2a2420]" />
            </div>
            <div className="flex h-2 rounded-full overflow-hidden bg-[#1a1614] border border-[#2a2420]">
              {Object.entries(typeBreakdown).map(([type, count]) => {
                const percentage = (count / stats.availableRolls) * 100;
                const colors = typeColors[type] || typeColors.Color;
                return (
                  <div
                    key={type}
                    className={`h-full transition-[width] duration-700 ease-[cubic-bezier(0.2,0,0,1)] ${colors.bar}`}
                    style={{ width: `${percentage}%` }}
                    title={`${type}: ${count} rolls (${Math.round(percentage)}%)`}
                  />
                );
              })}
            </div>
            <div className="flex flex-wrap gap-4 sm:gap-6 mt-3">
              {Object.entries(typeBreakdown).map(([type, count]) => {
                const colors = typeColors[type] || typeColors.Color;
                return (
                  <div
                    key={type}
                    className="flex items-center gap-2 text-xs text-[#8a8078]"
                  >
                    <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
                    <span className="tabular-nums">{type} ({count})</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Expiring Films Modal */}
      <Dialog open={showExpiringModal} onOpenChange={setShowExpiringModal}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#e8e4e0]">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Expiring Films
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto -mx-6 px-6">
            {expiringFilms.length === 0 ? (
              <p className="text-[#8a8078] text-center py-8">
                No films expiring soon
              </p>
            ) : (
              <div className="space-y-3 pb-4">
                {expiringFilms.map((film) => {
                  const status = getExpirationStatus(film.expiration_date, now);
                  const count = getAvailableCount(film);
                  const daysUntil = differenceInDays(new Date(film.expiration_date), now);

                  return (
                    <Link
                      key={film.id}
                      href={`${prefix}/film/${film.id}`}
                      onClick={() => setShowExpiringModal(false)}
                      className="block rounded-xl border border-[#2a2420] bg-[#1a1614]/50 p-4 transition-[background-color,border-color,transform] duration-200 ease-[cubic-bezier(0.2,0,0,1)] hover:border-[#3a3430] hover:bg-[#1a1614]/80 hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-600/35 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h4
                            className="text-[#e8e4e0] font-medium truncate"
                            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                          >
                            {film.name}
                          </h4>
                          <p className="text-sm text-[#8a8078]">
                            {film.brand} · {film.format} · ISO {film.iso}
                          </p>
                        </div>
                        <Badge className={`shrink-0 border ${status.color}`}>
                          {status.label}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#2a2420]">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-[#6a6460]" />
                          <span className={daysUntil < 0 ? "text-red-400" : "text-[#c8c4c0]"}>
                            {format(new Date(film.expiration_date), "MMM d, yyyy")}
                            {daysUntil < 0 && ` (${Math.abs(daysUntil)} days ago)`}
                            {daysUntil >= 0 && daysUntil <= 30 && ` (${daysUntil} days)`}
                          </span>
                        </div>
                        <span className="text-sm text-[#8a8078] tabular-nums">
                          {count} roll{count !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
