"use client";

import { useEffect, useState } from "react";
import { getWeeklyUsageStats, WeeklyUsage } from "@/app/actions/usage";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

export function WeeklyUsageChart() {
  const [data, setData] = useState<WeeklyUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getWeeklyUsageStats();
        if (result.data) {
          // Format dates for display with consistent formatting
          const formattedData = result.data.map((week) => {
            const date = new Date(week.week + "T00:00:00.000Z"); // Ensure UTC
            return {
              ...week,
              week_display: date.toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                timeZone: "UTC",
              }),
            };
          });
          setData(formattedData);
        }
      } catch (error) {
        console.error("Error loading weekly usage data:", error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (!mounted || loading) {
    return <div className="animate-pulse h-80 bg-gray-200 rounded"></div>;
  }

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="week_display" tick={{ fontSize: 12 }} />
        <YAxis yAxisId="rolls" orientation="left" />
        <YAxis yAxisId="cost" orientation="right" />
        <Tooltip
          formatter={(value, name) => {
            console.log("🚀 ~ name:", name);
            console.log("🚀 ~ value:", value);
            if (name === "Rolls Used") return [`${value} rolls`, "Rolls Used"];
            return [`€${Number(value).toFixed(2)}`, "Development Cost"];
          }}
          labelFormatter={(label) => `Week of ${label}`}
        />
        <Legend />
        <Line
          yAxisId="rolls"
          type="monotone"
          dataKey="rolls_used"
          stroke="#3b82f6"
          strokeWidth={2}
          name="Rolls Used"
        />
        <Line
          yAxisId="cost"
          type="monotone"
          dataKey="development_cost"
          stroke="#ef4444"
          strokeWidth={2}
          name="Development Cost (€)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
