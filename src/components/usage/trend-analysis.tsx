"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getWeeklyUsageStats, getMonthlyUsageStats } from "@/app/actions/usage";
import { detectTrend, calculateMean, TrendAnalysis } from "@/lib/prediction-utils";
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  Activity,
  BarChart3,
  Calendar,
  Clock,
  Zap
} from "lucide-react";

interface TrendInsight {
  metric: string;
  value: string;
  trend: TrendAnalysis;
  interpretation: string;
  icon: React.ReactNode;
  color: string;
}

export function TrendAnalysisComponent() {
  const [insights, setInsights] = useState<TrendInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [weeklyResult, monthlyResult] = await Promise.all([
          getWeeklyUsageStats(),
          getMonthlyUsageStats()
        ]);

        if (weeklyResult.data && monthlyResult.data) {
          const weeklyData = weeklyResult.data;
          const monthlyData = monthlyResult.data;

          const trendInsights: TrendInsight[] = [];

          // Monthly usage trend
          const monthlyRolls = monthlyData.map(m => m.rolls_used);
          const monthlyTrend = detectTrend(monthlyRolls);
          
          trendInsights.push({
            metric: "Monthly Usage",
            value: `${calculateMean(monthlyRolls).toFixed(1)} rolls/month`,
            trend: monthlyTrend,
            interpretation: getMonthlyTrendInterpretation(monthlyTrend),
            icon: <Calendar className="h-4 w-4" />,
            color: getTrendColor(monthlyTrend.direction)
          });

          // Weekly usage trend
          const weeklyRolls = weeklyData.map(w => w.rolls_used);
          const weeklyTrend = detectTrend(weeklyRolls);
          
          trendInsights.push({
            metric: "Weekly Usage",
            value: `${calculateMean(weeklyRolls).toFixed(1)} rolls/week`,
            trend: weeklyTrend,
            interpretation: getWeeklyTrendInterpretation(weeklyTrend),
            icon: <Clock className="h-4 w-4" />,
            color: getTrendColor(weeklyTrend.direction)
          });

          // Development cost trend
          const monthlyCosts = monthlyData.map(m => m.development_cost);
          const costTrend = detectTrend(monthlyCosts);
          
          trendInsights.push({
            metric: "Lab Costs",
            value: `€${calculateMean(monthlyCosts).toFixed(0)}/month`,
            trend: costTrend,
            interpretation: getCostTrendInterpretation(costTrend),
            icon: <BarChart3 className="h-4 w-4" />,
            color: getTrendColor(costTrend.direction)
          });

          // Activity consistency (variance analysis)
          const consistency = calculateConsistency(monthlyRolls);
          const consistencyTrend: TrendAnalysis = {
            direction: consistency > 0.7 ? 'up' : consistency < 0.3 ? 'down' : 'stable',
            strength: Math.abs(consistency - 0.5) * 200,
            changeRate: 0,
            significance: true
          };

          trendInsights.push({
            metric: "Consistency",
            value: `${(consistency * 100).toFixed(0)}% variable`,
            trend: consistencyTrend,
            interpretation: getConsistencyInterpretation(consistency),
            icon: <Activity className="h-4 w-4" />,
            color: consistency < 0.3 ? 'text-green-600' : consistency > 0.7 ? 'text-orange-600' : 'text-blue-600'
          });

          // Shooting intensity (recent vs historical)
          const recentMonths = monthlyData.slice(-3);
          const historicalMonths = monthlyData.slice(0, -3);
          
          if (historicalMonths.length > 0) {
            const recentAvg = calculateMean(recentMonths.map(m => m.rolls_used));
            const historicalAvg = calculateMean(historicalMonths.map(m => m.rolls_used));
            const intensityChange = ((recentAvg - historicalAvg) / historicalAvg) * 100;
            
            const intensityTrend: TrendAnalysis = {
              direction: intensityChange > 5 ? 'up' : intensityChange < -5 ? 'down' : 'stable',
              strength: Math.abs(intensityChange),
              changeRate: intensityChange,
              significance: Math.abs(intensityChange) > 10
            };

            trendInsights.push({
              metric: "Recent Activity",
              value: `${intensityChange > 0 ? '+' : ''}${intensityChange.toFixed(1)}%`,
              trend: intensityTrend,
              interpretation: getIntensityInterpretation(intensityChange),
              icon: <Zap className="h-4 w-4" />,
              color: getTrendColor(intensityTrend.direction)
            });
          }

          setInsights(trendInsights);
        }
      } catch (error) {
        console.error('Error loading trend analysis:', error);
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <div className="animate-pulse h-4 bg-gray-200 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="animate-pulse space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Not enough data for trend analysis</p>
          <p className="text-sm text-muted-foreground mt-2">
            Need at least 4 weeks of usage data to detect trends
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((insight, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <span className={insight.color}>{insight.icon}</span>
                {insight.metric}
              </CardTitle>
              {getTrendIcon(insight.trend.direction, insight.trend.significance)}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-2xl font-bold">{insight.value}</div>
                
                {insight.trend.significance && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Trend Strength</span>
                      <span>{Math.round(insight.trend.strength)}%</span>
                    </div>
                    <Progress value={insight.trend.strength} className="h-1" />
                  </div>
                )}

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {insight.interpretation}
                </p>

                {insight.trend.changeRate !== 0 && (
                  <Badge 
                    variant={insight.trend.direction === 'up' ? 'default' : 
                            insight.trend.direction === 'down' ? 'destructive' : 'secondary'}
                    className="text-xs"
                  >
                    {insight.trend.changeRate > 0 ? '+' : ''}{insight.trend.changeRate.toFixed(1)}% change
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

// Helper functions
function getTrendIcon(direction: string, significance: boolean) {
  const iconProps = { className: "h-4 w-4" };
  
  if (!significance) {
    return <Target {...iconProps} className="h-4 w-4 text-gray-400" />;
  }
  
  switch (direction) {
    case 'up': return <TrendingUp {...iconProps} className="h-4 w-4 text-green-600" />;
    case 'down': return <TrendingDown {...iconProps} className="h-4 w-4 text-red-600" />;
    default: return <Target {...iconProps} className="h-4 w-4 text-blue-600" />;
  }
}

function getTrendColor(direction: string): string {
  switch (direction) {
    case 'up': return 'text-green-600';
    case 'down': return 'text-red-600';
    default: return 'text-blue-600';
  }
}

function calculateConsistency(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = calculateMean(values);
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  return mean > 0 ? stdDev / mean : 0;
}

function getMonthlyTrendInterpretation(trend: TrendAnalysis): string {
  if (!trend.significance) {
    return "Your monthly usage is relatively stable with no significant trending pattern.";
  }
  
  if (trend.direction === 'up') {
    return `Your shooting activity is increasing by ${Math.abs(trend.changeRate).toFixed(1)}% per month. Great momentum!`;
  } else if (trend.direction === 'down') {
    return `Your monthly usage is declining by ${Math.abs(trend.changeRate).toFixed(1)}%. Consider planning more shoots.`;
  }
  
  return "Consistent monthly shooting habits - very predictable film usage.";
}

function getWeeklyTrendInterpretation(trend: TrendAnalysis): string {
  if (!trend.significance) {
    return "Your weekly shooting pattern shows no significant trending direction.";
  }
  
  if (trend.direction === 'up') {
    return `Weekly shooting frequency is increasing by ${Math.abs(trend.changeRate).toFixed(1)}% per week.`;
  } else if (trend.direction === 'down') {
    return `Weekly activity is declining by ${Math.abs(trend.changeRate).toFixed(1)}% per week.`;
  }
  
  return "Very consistent weekly shooting habits.";
}

function getCostTrendInterpretation(trend: TrendAnalysis): string {
  if (!trend.significance) {
    return "Your lab costs are relatively stable month to month.";
  }
  
  if (trend.direction === 'up') {
    return `Lab costs are increasing by ${Math.abs(trend.changeRate).toFixed(1)}% per month. Higher shooting activity or film type changes.`;
  } else if (trend.direction === 'down') {
    return `Lab costs are decreasing by ${Math.abs(trend.changeRate).toFixed(1)}% per month. Reduced shooting or different film choices.`;
  }
  
  return "Steady development spending patterns.";
}

function getConsistencyInterpretation(consistency: number): string {
  if (consistency < 0.3) {
    return "Very consistent shooting habits - you have predictable film usage patterns.";
  } else if (consistency < 0.5) {
    return "Moderately consistent shooting - some variation but generally predictable.";
  } else if (consistency < 0.7) {
    return "Variable shooting patterns - you adapt your activity to opportunities and inspiration.";
  } else {
    return "Highly variable shooting - dramatic changes in monthly usage patterns.";
  }
}

function getIntensityInterpretation(change: number): string {
  if (Math.abs(change) < 5) {
    return "Your recent shooting activity is very similar to your historical average.";
  } else if (change > 20) {
    return "You've been much more active recently compared to your historical patterns.";
  } else if (change > 5) {
    return "Your recent shooting activity is above your historical average.";
  } else if (change < -20) {
    return "You've been much less active recently compared to your historical patterns.";
  } else {
    return "Your recent shooting activity is below your historical average.";
  }
}