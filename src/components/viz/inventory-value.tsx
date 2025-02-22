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

interface InventoryValueProps {
  films: Film[];
}

export default function InventoryValue({ films }: InventoryValueProps) {
  // Check if films is undefined or empty
  if (!films || films.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Value Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <p>No film data available.</p>
        </CardContent>
      </Card>
    );
  }

  // Calculate value metrics
  const valueMetrics = films.reduce(
    (acc, film) => {
      if (film.price) {
        const quantity = film.count || 1;
        const totalPrice = film.price * quantity;
        acc.totalValue += totalPrice;
        acc.byType[film.type] = (acc.byType[film.type] || 0) + totalPrice;
        acc.byBrand[film.brand] = (acc.byBrand[film.brand] || 0) + totalPrice;
      }
      return acc;
    },
    {
      totalValue: 0,
      byType: {} as Record<string, number>,
      byBrand: {} as Record<string, number>,
    }
  );

  // Prepare data for pie chart
  const typeData = Object.entries(valueMetrics.byType).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Value Analysis</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium mb-4">
              Value Distribution by Type
            </h4>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
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
                  <Tooltip
                    formatter={(value) => `$${Number(value).toFixed(2)}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium mb-2">
                Total Inventory Value
              </h4>
              <div className="text-3xl font-bold animate-in fade-in-50 slide-in-from-bottom-5">
                ${valueMetrics.totalValue.toFixed(2)}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium mb-2">Value by Brand</h4>
              <div className="space-y-2">
                {Object.entries(valueMetrics.byBrand)
                  .sort(([, a], [, b]) => b - a)
                  .map(([brand, value]) => (
                    <div
                      key={brand}
                      className="flex justify-between items-center"
                    >
                      <span className="text-sm">{brand}</span>
                      <Badge variant="secondary">${value.toFixed(2)}</Badge>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
