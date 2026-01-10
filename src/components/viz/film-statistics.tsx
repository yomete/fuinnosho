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
  if (typeof film.available_count === "number" && film.available_count >= 0) {
    return film.available_count;
  }
  if (typeof film.total_count === "number" && film.total_count >= 0) {
    return film.total_count;
  }
  return film.count || 1;
}

function getTotalCount(film: Film): number {
  // For total inventory, prefer total_count over regular count
  if (typeof film.total_count === "number" && film.total_count >= 0) {
    return film.total_count;
  }
  return film.count || 1;
}

// Darkroom palette colors for charts
const COLORS = [
  "#d4a574", // warm amber/sepia for Color
  "#8a8078", // muted zinc for B&W
  "#4ade80", // emerald green for Slide
  "#f59e0b", // amber
  "#6b7280", // gray
];

// Brand colors
const BRAND_COLORS: Record<string, string> = {
  Kodak: "#FFD700",
  Fujifilm: "#00A550",
  Fuji: "#00A550",
  Ilford: "#E63946",
};

export default function FilmStatistics({ films }: FilmStatisticsProps) {
  const typeCount = films.reduce(
    (acc, film) => {
      const filmCount = getFilmCount(film);
      acc[film.type] = (acc[film.type] || 0) + filmCount;
      return acc;
    },
    {} as Record<string, number>
  );

  const brandCount = films.reduce(
    (acc, film) => {
      const filmCount = getFilmCount(film);
      acc[film.brand] = (acc[film.brand] || 0) + filmCount;
      return acc;
    },
    {} as Record<string, number>
  );

  // Convert typeCount to Recharts format
  const typeData = Object.entries(typeCount).map(([name, value]) => ({
    name,
    value,
  }));

  // Custom tooltip with darkroom styling
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number }>;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#1a1614] border border-[#2a2420] rounded-lg px-3 py-2 shadow-lg">
          <p className="text-[#e8e4e0] text-sm font-medium">
            {payload[0].name}
          </p>
          <p className="text-[#8a8078] text-sm">{payload[0].value} rolls</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
      <Card className="col-span-full sm:col-span-1">
        <CardHeader>
          <CardTitle className="text-[#e8e4e0]">
            Film Types Distribution
          </CardTitle>
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
                  label={({ name, value }) => `${name}: ${value}`}
                  labelLine={{ stroke: "#4a4440" }}
                  animationDuration={2000}
                  animationEasing="ease-in-out"
                >
                  {typeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="#1a1614"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  formatter={(value) => (
                    <span className="text-[#c8c4c0]">{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      <Card className="col-span-full md:col-span-2">
        <CardHeader>
          <CardTitle className="text-[#e8e4e0]">Inventory Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2 text-[#e8e4e0]">
                By Brand
              </h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(brandCount).map(([brand, count]) => (
                  <div
                    key={brand}
                    className="flex justify-between items-center p-2 rounded-lg bg-[#1a1614]/50"
                  >
                    <span className="text-sm text-[#8a8078]">{brand}</span>
                    <Badge
                      className="border"
                      style={{
                        backgroundColor: `${BRAND_COLORS[brand] || "#FFD700"}20`,
                        borderColor: `${BRAND_COLORS[brand] || "#FFD700"}50`,
                        color: BRAND_COLORS[brand] || "#FFD700",
                      }}
                    >
                      {count}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-lg bg-[#1a1614]/50 border border-[#2a2420]">
              <h4 className="text-sm font-medium mb-2 text-[#e8e4e0]">
                Available to Shoot
              </h4>
              <p className="text-3xl font-bold text-[#e8e4e0]">
                {films.reduce((sum, film) => sum + getFilmCount(film), 0)}
              </p>
              <p className="text-xs text-[#8a8078] mt-1">
                {films.reduce((sum, film) => sum + getTotalCount(film), 0)}{" "}
                total inventory
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
