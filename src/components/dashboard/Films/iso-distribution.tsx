"use client";

import type { Film } from "./utils";
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

export default function IsoDistribution({ films }: IsoDistributionProps) {
  // Group films by ISO and count
  const isoDistribution = films.reduce((acc, film) => {
    acc[film.iso] = (acc[film.iso] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // Convert to array and sort by ISO
  const data = Object.entries(isoDistribution)
    .map(([iso, count]) => ({
      iso: Number(iso),
      count,
    }))
    .sort((a, b) => a.iso - b.iso);

  // Calculate average ISO
  const averageIso =
    films.reduce((sum, film) => sum + film.iso, 0) / films.length;

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
              />
              <YAxis
                label={{
                  value: "Number of Films",
                  angle: -90,
                  position: "left",
                }}
              />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          Average ISO: {averageIso.toFixed(0)}
        </div>
      </CardContent>
    </Card>
  );
}
