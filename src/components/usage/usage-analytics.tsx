"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TripUsageTable } from "./trip-usage-table";
import { getFilmsUsedInLastMonth, UsageData } from "@/app/actions/usage";
import { getPredictiveAnalysis, PredictiveAnalysis } from "@/app/actions/predictions";
import { Film, Calendar, DollarSign, TrendingUp } from "lucide-react";

interface FilmUsageSummary {
  filmName: string;
  quantity: number;
  developmentCost: number;
  developmentType: string;
}

export function UsageAnalytics() {
  const [recentFilms, setRecentFilms] = useState<FilmUsageSummary[]>([]);
  const [predictions, setPredictions] = useState<PredictiveAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const [recentFilmsResult, predictionsResult] = await Promise.all([
          getFilmsUsedInLastMonth(),
          getPredictiveAnalysis()
        ]);

        if (recentFilmsResult.data) {
          // Group films by name and sum quantities
          const filmMap = new Map<string, FilmUsageSummary>();

          recentFilmsResult.data.forEach((usage: UsageData) => {
            const filmName = `${usage.film.brand} ${usage.film.name}`;
            const existing = filmMap.get(filmName);

            if (existing) {
              existing.quantity += usage.quantity;
              existing.developmentCost += usage.development_cost;
            } else {
              filmMap.set(filmName, {
                filmName,
                quantity: usage.quantity,
                developmentCost: usage.development_cost,
                developmentType: usage.development_type
              });
            }
          });

          setRecentFilms(Array.from(filmMap.values()).sort((a, b) => b.quantity - a.quantity));
        }

        if (predictionsResult.data) {
          setPredictions(predictionsResult.data);
        }
      } catch (error) {
        console.error("Error loading usage data:", error);
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
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {[...Array(2)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-[#2a2420] rounded w-3/4"></div>
              </CardHeader>
              <CardContent className="animate-pulse">
                <div className="h-8 bg-[#2a2420] rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Films Used in Past Month */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[#e8e4e0]">
            <Film className="h-5 w-5 text-amber-500/80" />
            Films Used in Past Month
          </CardTitle>
          <CardDescription className="text-[#8a8078]">
            Film consumption over the last 30 days
          </CardDescription>
        </CardHeader>
        <CardContent>
          {recentFilms.length === 0 ? (
            <p className="text-[#8a8078]">No films used in the past month</p>
          ) : (
            <div className="space-y-3">
              {recentFilms.map((film, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-[#2a2420] rounded-lg bg-[#1a1614]/30">
                  <div>
                    <div className="font-medium text-[#e8e4e0]">{film.filmName}</div>
                    <div className="text-sm text-[#8a8078]">
                      {film.quantity} roll{film.quantity !== 1 ? 's' : ''}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{film.developmentType}</Badge>
                    <span className="text-sm font-medium text-[#e8e4e0]">{'\u20AC'}{film.developmentCost.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Next Month Predictions */}
      {predictions && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#e8e4e0]">
                <Calendar className="h-5 w-5 text-amber-500/80" />
                Predicted Usage - Next Month
              </CardTitle>
              <CardDescription className="text-[#8a8078]">
                Based on planned trips and usage patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8a8078]">Expected rolls:</span>
                  <span className="font-bold text-[#e8e4e0]">{predictions.monthlyForecast.expected}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8a8078]">Range:</span>
                  <span className="text-sm text-[#e8e4e0]">
                    {predictions.monthlyForecast.conservative} - {predictions.monthlyForecast.optimistic}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8a8078]">Trend:</span>
                  <div className="flex items-center gap-1">
                    {predictions.monthlyForecast.trend === 'increasing' ? (
                      <TrendingUp className="h-4 w-4 text-emerald-500" />
                    ) : predictions.monthlyForecast.trend === 'decreasing' ? (
                      <TrendingUp className="h-4 w-4 text-red-400 rotate-180" />
                    ) : (
                      <div className="h-4 w-4 bg-amber-500/50 rounded-full" />
                    )}
                    <span className="text-sm text-[#e8e4e0] capitalize">{predictions.monthlyForecast.trend}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-[#e8e4e0]">
                <DollarSign className="h-5 w-5 text-amber-500/80" />
                Predicted Development Cost
              </CardTitle>
              <CardDescription className="text-[#8a8078]">
                B&W: Home dev {'\u2022'} C41: {'\u20AC'}6 {'\u2022'} ECN: {'\u20AC'}9
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8a8078]">Expected cost:</span>
                  <span className="font-bold text-2xl text-[#e8e4e0]">{'\u20AC'}{predictions.monthlyForecast.developmentCost.expected.toFixed(0)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[#8a8078]">Range:</span>
                  <span className="text-sm text-[#e8e4e0]">
                    {'\u20AC'}{predictions.monthlyForecast.developmentCost.min.toFixed(0)} - {'\u20AC'}{predictions.monthlyForecast.developmentCost.max.toFixed(0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Trip Usage Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[#e8e4e0]">Trip Usage & Costs</CardTitle>
          <CardDescription className="text-[#8a8078]">
            Film usage and development costs broken down by photography trips
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TripUsageTable />
        </CardContent>
      </Card>
    </div>
  );
}
