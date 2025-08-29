"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  getPredictiveAnalysis,
  PredictiveAnalysis,
} from "@/app/actions/predictions";
import { formatTripDuration } from "@/lib/utils";
import { PredictiveChart } from "./predictive-chart";
import { SeasonalPatterns } from "./seasonal-patterns";
import { TrendAnalysisComponent } from "./trend-analysis";
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  DollarSign,
  Film,
  Target,
  AlertTriangle,
  Lightbulb,
  ShoppingCart,
  ChevronDown,
  ChevronUp,
  BarChart3,
  Activity,
  Scissors,
} from "lucide-react";

export function StreamlinedPredictions() {
  const [predictions, setPredictions] = useState<PredictiveAnalysis | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    charts: false,
    patterns: false,
    trends: false,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadPredictions() {
      try {
        const result = await getPredictiveAnalysis();
        if (result.data) {
          setPredictions(result.data);
        }
      } catch (error) {
        console.error("Error loading predictions:", error);
      } finally {
        setLoading(false);
      }
    }

    if (mounted) {
      loadPredictions();
    }
  }, [mounted]);

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  if (!mounted || loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!predictions) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No prediction data available</p>
          <p className="text-sm text-muted-foreground mt-2">
            Use more film to generate accurate forecasts
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "increasing":
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case "decreasing":
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Target className="h-4 w-4 text-blue-600" />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "bg-green-100 text-green-800";
    if (confidence >= 60) return "bg-yellow-100 text-yellow-800";
    return "bg-orange-100 text-orange-800";
  };

  return (
    <div className="space-y-6">
      {/* Key Metrics - Always Visible */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Weekly Forecast */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {predictions.weeklyForecast.expected}
              </div>
              <span className="text-sm text-muted-foreground">rolls</span>
              {getTrendIcon(predictions.weeklyForecast.trend)}
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-muted-foreground">
                {predictions.weeklyForecast.conservative}-
                {predictions.weeklyForecast.optimistic} range
              </p>
              <Badge
                variant="outline"
                className={getConfidenceColor(
                  predictions.weeklyForecast.confidence
                )}
              >
                {predictions.weeklyForecast.confidence}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Forecast */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next Month</CardTitle>
            <Film className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className="text-2xl font-bold">
                {predictions.monthlyForecast.expected}
              </div>
              <span className="text-sm text-muted-foreground">rolls</span>
              {getTrendIcon(predictions.monthlyForecast.trend)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {predictions.monthlyForecast.conservative}-
              {predictions.monthlyForecast.optimistic} range
            </p>
          </CardContent>
        </Card>

        {/* Budget Forecast */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Lab Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{predictions.monthlyForecast.developmentCost.expected.toFixed(0)}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              €{predictions.monthlyForecast.developmentCost.min.toFixed(0)}-€
              {predictions.monthlyForecast.developmentCost.max.toFixed(0)} range
            </p>
          </CardContent>
        </Card>

        {/* Overall Trend */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trend</CardTitle>
            {getTrendIcon(
              predictions.trendAnalysis.direction === "up"
                ? "increasing"
                : predictions.trendAnalysis.direction === "down"
                ? "decreasing"
                : "stable"
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {predictions.trendAnalysis.direction === "up"
                ? "Growing"
                : predictions.trendAnalysis.direction === "down"
                ? "Declining"
                : "Stable"}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.abs(predictions.trendAnalysis.changeRate).toFixed(1)}% per
              month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budget Alert */}
      {predictions.budgetAlert && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Budget Alert:</strong> {predictions.budgetAlert.message} - €
            {predictions.budgetAlert.amount.toFixed(2)}{" "}
            {predictions.budgetAlert.comparison}
          </AlertDescription>
        </Alert>
      )}

      {/* Planned Trips - Compact */}
      {predictions.plannedTrips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5" />
              Upcoming Trips ({predictions.plannedTrips.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 md:grid-cols-2">
              {predictions.plannedTrips.slice(0, 4).map((trip, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg bg-card"
                >
                  <div>
                    <div className="text-sm font-medium text-card-foreground">
                      {trip.tripTitle}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(trip.tripDate).toLocaleDateString()} •{" "}
                      {trip.daysFromNow} days •{" "}
                      {formatTripDuration(trip.tripDate, trip.tripEndDate)}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Badge variant="outline" className="text-xs">
                      {trip.reservedRolls}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      €{trip.developmentCost}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bulk Film Predictions */}
      {predictions.bulkFilmInsights && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Scissors className="h-5 w-5 text-orange-600" />
              Bulk Film Predictions
            </CardTitle>
            <CardDescription>
              Spooling recommendations and efficiency insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Efficiency Status */}
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <div className="text-sm font-medium">Spooling Efficiency</div>
                  <div className="text-xs text-muted-foreground">
                    {predictions.bulkFilmInsights.wasteAnalysis.wastePercentage.toFixed(
                      1
                    )}
                    % waste rate
                  </div>
                </div>
                <Badge
                  variant={
                    predictions.bulkFilmInsights.spoolingEfficiencyTrend ===
                    "improving"
                      ? "default"
                      : predictions.bulkFilmInsights.spoolingEfficiencyTrend ===
                        "declining"
                      ? "destructive"
                      : "secondary"
                  }
                >
                  {predictions.bulkFilmInsights.spoolingEfficiencyTrend}
                </Badge>
              </div>

              {/* Spooling Recommendations */}
              {predictions.bulkFilmInsights.predictedSpoolingNeed
                .recommendedSpooling.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-amber-600">
                    Action Needed:
                  </div>
                  {predictions.bulkFilmInsights.predictedSpoolingNeed.recommendedSpooling.map(
                    (rec, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 border rounded bg-amber-50 dark:bg-amber-800"
                      >
                        <div>
                          <div className="text-sm font-medium">
                            {rec.filmName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Spool {rec.exposuresToSpool} exposures
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className="text-amber-700 dark:text-amber-300 text-xs"
                        >
                          {rec.cassettesToCreate} cassettes
                        </Badge>
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights - Compact */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lightbulb className="h-5 w-5" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {predictions.shootingInsights
                .slice(0, 3)
                .map((insight, index) => (
                  <div
                    key={index}
                    className="text-sm p-3 border rounded-lg bg-muted/30 text-foreground"
                  >
                    {insight}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5" />
              Stock Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {predictions.stockRecommendations
                .slice(0, 3)
                .map((rec, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg bg-card"
                  >
                    <div>
                      <div className="text-sm font-medium text-card-foreground">
                        {rec.filmType}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {rec.reason}
                      </div>
                    </div>
                    <Badge
                      variant={rec.action === "buy" ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {rec.action === "buy" ? `Buy (${rec.urgency})` : "OK"}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Expandable Detailed Sections */}
      <div className="space-y-4">
        {/* Charts Section */}
        <Collapsible
          open={expandedSections.charts}
          onOpenChange={() => toggleSection("charts")}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Forecast Charts
                  </CardTitle>
                  {expandedSections.charts ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>
                  Detailed historical trends and future predictions
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <div className="grid gap-4 lg:grid-cols-2">
                  <PredictiveChart type="weekly" forecastPeriods={4} />
                  <PredictiveChart type="monthly" forecastPeriods={3} />
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Seasonal Patterns */}
        <Collapsible
          open={expandedSections.patterns}
          onOpenChange={() => toggleSection("patterns")}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Seasonal Patterns
                  </CardTitle>
                  {expandedSections.patterns ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>
                  Your shooting patterns throughout the year
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <SeasonalPatterns />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>

        {/* Trend Analysis */}
        <Collapsible
          open={expandedSections.trends}
          onOpenChange={() => toggleSection("trends")}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Detailed Trend Analysis
                  </CardTitle>
                  {expandedSections.trends ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
                <CardDescription>
                  Deep insights into your photography habits and trends
                </CardDescription>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <TrendAnalysisComponent />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
}
