"use client";

import { type Film } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface IsoDistributionProps {
  films: Film[];
}

function getAvailableFilmCount(film: Film): number {
  // Use available_count to show distribution of films available to shoot
  if (typeof film.available_count === 'number' && film.available_count >= 0) {
    return film.available_count;
  }
  if (typeof film.total_count === 'number' && film.total_count >= 0) {
    return film.total_count;
  }
  return film.count || 1;
}

export default function IsoDistribution({ films }: IsoDistributionProps) {
  // Group films by ISO and count
  const isoDistribution = films.reduce((acc, film) => {
    const filmCount = getAvailableFilmCount(film);
    acc[film.iso] = (acc[film.iso] || 0) + filmCount;
    return acc;
  }, {} as Record<number, number>);

  // Calculate average ISO (weighted by count)
  const totalCount = films.reduce((sum, film) => sum + getAvailableFilmCount(film), 0);
  const averageIso = totalCount > 0 
    ? films.reduce((sum, film) => {
        const filmCount = getAvailableFilmCount(film);
        return sum + film.iso * filmCount;
      }, 0) / totalCount
    : 0;

  // Convert to array and sort by ISO
  const data = Object.entries(isoDistribution)
    .map(([iso, count]) => ({
      iso: Number(iso),
      count,
    }))
    .sort((a, b) => a.iso - b.iso);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>ISO Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <XAxis
                dataKey="iso"
                label={{ value: "ISO Speed", position: "bottom" }}
                stroke="hsl(var(--foreground))"
                tick={{ fill: "hsl(var(--foreground))" }}
              />
              <YAxis
                label={{
                  value: "Number of Films",
                  angle: -90,
                  position: "left",
                  style: { fill: "hsl(var(--foreground))" },
                }}
                stroke="hsl(var(--foreground))"
                tick={{ fill: "hsl(var(--foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--background))",
                  border: "1px solid hsl(var(--border))",
                  color: "hsl(var(--foreground))",
                }}
              />
              <Bar
                dataKey="count"
                fill="hsl(var(--primary))"
                animationDuration={2000}
                animationEasing="ease-in-out"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-muted-foreground animate-in fade-in-50">
          Average ISO: {totalCount > 0 ? averageIso.toFixed(0) : 'N/A'}
        </div>
      </CardContent>
    </Card>
  );
}
