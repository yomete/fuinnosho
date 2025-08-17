"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSeasonalPatterns } from "@/app/actions/predictions";
import { RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface SeasonalData {
  monthlyMultipliers: Record<string, number>;
  peakMonths: string[];
  lowMonths: string[];
  seasonalTrend: string;
  bestShootingMonths: string[];
  quietestMonths: string[];
}

export function SeasonalPatterns() {
  const [data, setData] = useState<SeasonalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getSeasonalPatterns();
        if (result.data) {
          setData(result.data);
        }
      } catch (error) {
        console.error('Error loading seasonal patterns:', error);
      } finally {
        setLoading(false);
      }
    }

    if (mounted) {
      loadData();
    }
  }, [mounted]);

  if (!mounted || loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Seasonal Patterns</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse h-64 bg-gray-200 rounded"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No seasonal data available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Need at least 6 months of data to detect patterns
          </p>
        </CardContent>
      </Card>
    );
  }

  // Prepare data for radar chart (circular year view)
  const radarData = Object.entries(data.monthlyMultipliers).map(([month, multiplier]) => ({
    month,
    activity: multiplier,
    fullMonth: getFullMonthName(month)
  }));

  // Prepare data for bar chart
  const barData = radarData.map(item => ({
    ...item,
    activityPercent: (item.activity * 100).toFixed(0)
  }));


  const getSeasonalInsight = () => {
    if (data.peakMonths.length === 0 && data.lowMonths.length === 0) {
      return "Very consistent shooting throughout the year";
    }
    
    const insights = [];
    if (data.peakMonths.length > 0) {
      insights.push(`Peak months: ${data.peakMonths.join(', ')}`);
    }
    if (data.lowMonths.length > 0) {
      insights.push(`Quieter months: ${data.lowMonths.join(', ')}`);
    }
    return insights.join(' • ');
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Seasonal Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{data.seasonalTrend}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {data.seasonalTrend === 'seasonal' ? 'Clear seasonal variations' : 'Consistent year-round'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Peak Season</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.bestShootingMonths.length > 0 ? data.bestShootingMonths[0] : 'None'}
            </div>
            <div className="flex gap-1 mt-2">
              {data.bestShootingMonths.slice(0, 3).map(month => (
                <Badge key={month} variant="default" className="text-xs">
                  {month}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Quiet Season</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data.quietestMonths.length > 0 ? data.quietestMonths[0] : 'None'}
            </div>
            <div className="flex gap-1 mt-2">
              {data.quietestMonths.slice(0, 3).map(month => (
                <Badge key={month} variant="outline" className="text-xs">
                  {month}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Circular Year View */}
        <Card>
          <CardHeader>
            <CardTitle>Annual Activity Cycle</CardTitle>
            <CardDescription>
              Your shooting intensity throughout the year (1.0 = average)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis 
                  dataKey="month" 
                  tick={{ fontSize: 12 }}
                  className="text-xs"
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, Math.max(...Object.values(data.monthlyMultipliers)) * 1.1]}
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="Activity Level"
                  dataKey="activity"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Activity Levels</CardTitle>
            <CardDescription>
              Relative shooting activity by month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="month"
                  tick={{ fontSize: 11 }}
                />
                <YAxis 
                  tick={{ fontSize: 11 }}
                  label={{ value: 'Activity Level', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value) => [
                    `${Number(value).toFixed(2)}x average`,
                    'Activity Level'
                  ]}
                  labelFormatter={(label) => `${getFullMonthName(label)}`}
                />
                <Bar 
                  dataKey="activity" 
                  fill="hsl(var(--primary))"
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
            
            {/* Reference line for average */}
            <div className="text-xs text-muted-foreground text-center mt-2">
              1.0 = Your average monthly usage
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Seasonal Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm">
              📅 <strong>Pattern:</strong> {getSeasonalInsight()}
            </p>
            
            {data.seasonalTrend === 'seasonal' && (
              <>
                <p className="text-sm">
                  📈 <strong>Best time to plan shoots:</strong> {data.bestShootingMonths.join(', ')} 
                  (you typically shoot {Math.round((Math.max(...Object.values(data.monthlyMultipliers)) - 1) * 100)}% more than average)
                </p>
                
                {data.quietestMonths.length > 0 && (
                  <p className="text-sm">
                    📉 <strong>Quieter periods:</strong> {data.quietestMonths.join(', ')} 
                    (good time for gear maintenance and film stock planning)
                  </p>
                )}
              </>
            )}
            
            {data.seasonalTrend === 'consistent' && (
              <p className="text-sm">
                🎯 <strong>Consistent shooter:</strong> You maintain steady photography habits year-round, 
                making it easier to predict your film needs.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function getFullMonthName(shortMonth: string): string {
  const monthMap: Record<string, string> = {
    'Jan': 'January', 'Feb': 'February', 'Mar': 'March', 'Apr': 'April',
    'May': 'May', 'Jun': 'June', 'Jul': 'July', 'Aug': 'August',
    'Sep': 'September', 'Oct': 'October', 'Nov': 'November', 'Dec': 'December'
  };
  return monthMap[shortMonth] || shortMonth;
}