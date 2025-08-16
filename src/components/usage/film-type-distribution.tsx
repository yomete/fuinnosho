"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllUsageData } from "@/app/actions/usage";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FilmTypeData {
  type: string;
  rolls: number;
  cost: number;
}

export function FilmTypeDistribution() {
  const [data, setData] = useState<FilmTypeData[]>([]);
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
          const typeStats: Record<string, { rolls: number; cost: number }> = {};
          
          result.data.forEach(usage => {
            const type = usage.development_type;
            if (!typeStats[type]) {
              typeStats[type] = { rolls: 0, cost: 0 };
            }
            typeStats[type].rolls += usage.quantity;
            typeStats[type].cost += usage.total_cost;
          });
          
          const chartData = Object.entries(typeStats).map(([type, stats]) => ({
            type,
            rolls: stats.rolls,
            cost: stats.cost
          }));
          
          setData(chartData);
        }
      } catch (error) {
        console.error('Error loading film type distribution:', error);
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
          <CardTitle>Film Type Distribution</CardTitle>
          <CardDescription>Usage by development type</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Film Type Distribution</CardTitle>
        <CardDescription>
          Rolls used by development type
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" />
            <YAxis />
            <Tooltip 
              formatter={(value, name) => [
                name === 'rolls' ? `${value} rolls` : `€${Number(value).toFixed(2)}`,
                name === 'rolls' ? 'Rolls Used' : 'Total Cost'
              ]}
            />
            <Bar dataKey="rolls" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}