"use client";

import type { Film } from "./utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AcquisitionTimelineProps {
  films: Film[];
}

export default function AcquisitionTimeline({
  films,
}: AcquisitionTimelineProps) {
  // Group films by brand and creation date
  const timelineData = films.reduce((acc, film) => {
    const date = new Date(film.created_at).toISOString().split("T")[0];

    if (!acc[date]) {
      acc[date] = {};
    }

    acc[date][film.brand] = (acc[date][film.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, Record<string, number>>);

  // Convert to array format for chart
  const data = Object.entries(timelineData)
    .map(([date, brands]) => ({
      date,
      ...brands,
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Get unique brands for lines
  const brands = Array.from(new Set(films.map((f) => f.brand)));

  // Generate colors for each brand
  const brandColors = {
    Kodak: "hsl(var(--primary))",
    Ilford: "hsl(var(--secondary))",
    Fujifilm: "hsl(var(--accent))",
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Film Acquisition Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis
                label={{
                  value: "Films Acquired",
                  angle: -90,
                  position: "left",
                }}
              />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Legend />
              {brands.map((brand) => (
                <Line
                  key={brand}
                  type="monotone"
                  dataKey={brand}
                  stroke={brandColors[brand as keyof typeof brandColors]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
