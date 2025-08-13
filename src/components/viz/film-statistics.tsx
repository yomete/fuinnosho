"use client";

import { type Film } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

interface FilmStatisticsProps {
  films: Film[];
}

function getFilmCount(film: Film): number {
  // Use available_count if it exists and is valid, otherwise fall back to total_count, then count
  if (typeof film.available_count === 'number' && film.available_count >= 0) {
    return film.available_count;
  }
  if (typeof film.total_count === 'number' && film.total_count >= 0) {
    return film.total_count;
  }
  return film.count || 1;
}

function getTotalCount(film: Film): number {
  // For total inventory, prefer total_count over regular count
  if (typeof film.total_count === 'number' && film.total_count >= 0) {
    return film.total_count;
  }
  return film.count || 1;
}

export default function FilmStatistics({ films }: FilmStatisticsProps) {
  const typeCount = films.reduce((acc, film) => {
    const filmCount = getFilmCount(film);
    acc[film.type] = (acc[film.type] || 0) + filmCount;
    return acc;
  }, {} as Record<string, number>);

  const brandCount = films.reduce((acc, film) => {
    const filmCount = getFilmCount(film);
    acc[film.brand] = (acc[film.brand] || 0) + filmCount;
    return acc;
  }, {} as Record<string, number>);

  // Convert typeCount to Recharts format
  const typeData = Object.entries(typeCount).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <Card className="col-span-full sm:col-span-1">
        <CardHeader>
          <CardTitle>Film Types Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] sm:h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={typeData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                >
                  {typeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-full md:col-span-2">
        <CardHeader>
          <CardTitle>Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">By Brand</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(brandCount).map(([brand, count]) => (
                  <div
                    key={brand}
                    className="flex justify-between items-center"
                  >
                    <span className="text-sm text-muted-foreground">
                      {brand}
                    </span>
                    <Badge>{count}</Badge>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Available to Shoot</h4>
              <p className="text-2xl font-bold">
                {films.reduce((sum, film) => sum + getFilmCount(film), 0)}
              </p>
              <p className="text-xs text-muted-foreground">
                {films.reduce((sum, film) => sum + getTotalCount(film), 0)} total inventory
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
