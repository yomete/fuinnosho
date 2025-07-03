"use client";

import { useEffect, useState, useCallback } from "react";
import { Film } from "@/lib/utils";
import { getFilmUsageHistory } from "@/app/actions/films";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { TrendingDown, Package, Calendar, Activity } from "lucide-react";

interface FilmUsageStatsProps {
  films: Film[];
}

interface UsageStats {
  filmId: string;
  filmName: string;
  totalUsed: number;
  usageCount: number;
  lastUsed: Date | null;
  currentStock: number;
  usageRate: number; // rolls per month
}

export function FilmUsageStats({ films }: FilmUsageStatsProps) {
  const [usageStats, setUsageStats] = useState<UsageStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAllUsageStats = useCallback(async () => {
    setIsLoading(true);
    const stats: UsageStats[] = [];

    for (const film of films) {
      const { data } = await getFilmUsageHistory(film.id);
      if (data) {
        const totalUsed = data.reduce((sum, usage) => sum + usage.quantity, 0);
        const lastUsage = data.length > 0 ? new Date(data[0].created_at) : null;

        // Calculate usage rate (rolls per month)
        let usageRate = 0;
        if (data.length > 0 && lastUsage) {
          const firstUsage = new Date(data[data.length - 1].created_at);
          const monthsDiff =
            (lastUsage.getTime() - firstUsage.getTime()) /
            (1000 * 60 * 60 * 24 * 30);
          usageRate = monthsDiff > 0 ? totalUsed / monthsDiff : totalUsed;
        }

        stats.push({
          filmId: film.id,
          filmName: film.name,
          totalUsed,
          usageCount: data.length,
          lastUsed: lastUsage,
          currentStock: film.count || 0,
          usageRate: Math.round(usageRate * 10) / 10,
        });
      }
    }

    // Sort by total usage
    stats.sort((a, b) => b.totalUsed - a.totalUsed);
    setUsageStats(stats);
    setIsLoading(false);
  }, [films]);

  useEffect(() => {
    loadAllUsageStats();
  }, [loadAllUsageStats]);

  const mostUsedFilms = usageStats.slice(0, 5);
  const totalUsageAcrossAllFilms = usageStats.reduce(
    (sum, stat) => sum + stat.totalUsed,
    0
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Film Usage Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Loading usage statistics...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Usage Overview
          </CardTitle>
          <CardDescription>
            Total rolls used across all films: {totalUsageAcrossAllFilms}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Most Used Film</p>
              <p className="text-2xl font-bold">
                {mostUsedFilms[0]?.filmName || "N/A"}
              </p>
              <p className="text-xs text-muted-foreground">
                {mostUsedFilms[0]?.totalUsed || 0} rolls
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Active Films</p>
              <p className="text-2xl font-bold">
                {usageStats.filter((s) => s.totalUsed > 0).length}
              </p>
              <p className="text-xs text-muted-foreground">
                Films with recorded usage
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Low Stock</p>
              <p className="text-2xl font-bold">
                {
                  usageStats.filter(
                    (s) => s.currentStock <= 2 && s.currentStock > 0
                  ).length
                }
              </p>
              <p className="text-xs text-muted-foreground">
                Films with 2 or fewer rolls
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Out of Stock</p>
              <p className="text-2xl font-bold">
                {usageStats.filter((s) => s.currentStock === 0).length}
              </p>
              <p className="text-xs text-muted-foreground">
                Films with no remaining stock
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5" />
            Most Used Films
          </CardTitle>
          <CardDescription>Top 5 films by total usage</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mostUsedFilms.map((stat, index) => (
            <div key={stat.filmId} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {index + 1}. {stat.filmName}
                  </span>
                  <Badge variant="outline" className="text-xs">
                    <Package className="h-3 w-3 mr-1" />
                    {stat.currentStock} left
                  </Badge>
                  {stat.usageRate > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      ~{stat.usageRate}/month
                    </Badge>
                  )}
                </div>
                <span className="text-sm text-muted-foreground">
                  {stat.totalUsed} rolls used
                </span>
              </div>
              <Progress
                value={(stat.totalUsed / totalUsageAcrossAllFilms) * 100}
              />
              {stat.lastUsed && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  Last used: {stat.lastUsed.toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
