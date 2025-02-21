"use client";

import { type Film, formatDimensions } from "../utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Box, Archive } from "lucide-react";

interface StorageCalculatorProps {
  films: Film[];
}

export default function StorageCalculator({ films }: StorageCalculatorProps) {
  // Calculate storage metrics
  const storageMetrics = films.reduce(
    (acc, film) => {
      const format =
        formatDimensions[film.format as keyof typeof formatDimensions];
      const quantity = film.count || 1;

      if (format) {
        // Calculate approximate volume in cubic mm
        let volume = format.width * format.height;
        if (film.format === "35mm" || film.format === "120") {
          // Add thickness for roll film (approximate)
          if ("rollLength" in format) {
            volume *= format.rollLength * 0.2; // 0.2mm per frame thickness
          }
        } else {
          // Sheet film
          if ("sheetsPerBox" in format) {
            volume *= format.sheetsPerBox * 0.3; // 0.3mm per sheet thickness
          }
        }

        acc.totalVolume += volume * quantity;
        acc.formatCounts[film.format] =
          (acc.formatCounts[film.format] || 0) + quantity;
      }

      return acc;
    },
    {
      totalVolume: 0,
      formatCounts: {} as Record<string, number>,
    }
  );

  // Get total count of all films
  const totalFilmCount = films.reduce(
    (sum, film) => sum + (film.count || 1),
    0
  );

  // Convert volume to more readable units (cubic cm)
  const totalVolumeCm3 = storageMetrics.totalVolume / 1000;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="h-5 w-5" />
          Storage Requirements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-medium mb-2">Format Distribution</h4>
            <div className="space-y-4">
              {Object.entries(storageMetrics.formatCounts).map(
                ([format, count]) => (
                  <div key={format}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <Box className="h-4 w-4" />
                        {format}
                      </span>
                      <span>{count} items</span>
                    </div>
                    <Progress
                      value={(count / totalFilmCount) * 100}
                      className="h-2"
                    />
                  </div>
                )
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">
              Estimated Storage Volume
            </h4>
            <div className="grid gap-2">
              <div className="text-2xl font-bold">
                {totalVolumeCm3.toFixed(1)} cm³
              </div>
              <p className="text-sm text-muted-foreground">
                Approximate storage box size:{" "}
                {Math.ceil(Math.cbrt(totalVolumeCm3))}cm per side
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
