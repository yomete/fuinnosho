"use client";

import { useEffect, useState } from "react";
import { getMonthlyUsageStats, MonthlyUsage } from "@/app/actions/usage";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function MonthlyUsageChart() {
  const [data, setData] = useState<MonthlyUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getMonthlyUsageStats();
        if (result.data) {
          // Format dates for display with consistent formatting
          const formattedData = result.data.map(month => {
            const date = new Date(month.month + '-01T00:00:00.000Z'); // Ensure UTC
            return {
              ...month,
              month_display: date.toLocaleDateString('en-US', { 
                year: '2-digit',
                month: 'short',
                timeZone: 'UTC'
              })
            };
          });
          setData(formattedData);
        }
      } catch (error) {
        console.error('Error loading monthly usage data:', error);
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
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
          dataKey="month_display"
          tick={{ fontSize: 12 }}
        />
        <YAxis yAxisId="rolls" orientation="left" />
        <YAxis yAxisId="cost" orientation="right" />
        <Tooltip 
          formatter={(value, name) => {
            if (name === 'rolls_used') return [`${value} rolls`, 'Rolls Used'];
            if (name === 'development_cost') return [`€${Number(value).toFixed(2)}`, 'Development Cost'];
            return [`${value}`, name];
          }}
        />
        <Legend />
        <Bar 
          yAxisId="rolls"
          dataKey="rolls_used" 
          fill="#3b82f6" 
          name="Rolls Used"
        />
        <Bar 
          yAxisId="cost"
          dataKey="development_cost" 
          fill="#ef4444" 
          name="Development Cost (€)"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}