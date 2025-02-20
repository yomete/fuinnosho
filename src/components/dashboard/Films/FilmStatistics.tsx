"use client";

import { Film } from "./utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
} from "chart.js";
import { Badge } from "@/components/ui/badge";
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale);

interface FilmStatisticsProps {
  films: Film[];
}

export default function FilmStatistics({ films }: FilmStatisticsProps) {
  const typeCount = films.reduce((acc, film) => {
    acc[film.type] = (acc[film.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const brandCount = films.reduce((acc, film) => {
    acc[film.brand] = (acc[film.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = {
    labels: Object.keys(typeCount),
    datasets: [
      {
        data: Object.values(typeCount),
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 206, 86, 0.8)",
        ],
      },
    ],
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4">
      <Card className="col-span-full md:col-span-1">
        <CardHeader>
          <CardTitle>Film Types Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center">
            <Doughnut
              data={chartData}
              options={{ maintainAspectRatio: false }}
            />
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
              <h4 className="text-sm font-medium mb-2">Total Films</h4>
              <p className="text-2xl font-bold">{films.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
