"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllUsageData } from "@/app/actions/usage";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CostData {
  name: string;
  value: number;
  color: string;
}

export function CostBreakdown() {
  const [data, setData] = useState<CostData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getAllUsageData();
        if (result.data) {
          // Group by development type instead of film vs dev cost
          const costByType: Record<string, number> = {};
          
          result.data.forEach(usage => {
            const type = usage.development_type;
            costByType[type] = (costByType[type] || 0) + usage.development_cost;
          });
          
          const colors = { 'C41': '#3b82f6', 'B&W': '#ef4444', 'ECN': '#10b981' };
          
          setData(
            Object.entries(costByType).map(([type, cost]) => ({
              name: `${type} Development`,
              value: cost,
              color: colors[type as keyof typeof colors] || '#6b7280'
            }))
          );
        }
      } catch (error) {
        console.error('Error loading cost breakdown:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (!mounted || loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Breakdown</CardTitle>
          <CardDescription>Film vs Development costs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Development Cost Breakdown</CardTitle>
        <CardDescription>
          Lab costs by film type (€{total.toFixed(2)} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
            <Legend 
              formatter={(value, entry) => (
                <span style={{ color: entry.color }}>
                  {value}: €{data.find(d => d.name === value)?.value.toFixed(2)}
                </span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}