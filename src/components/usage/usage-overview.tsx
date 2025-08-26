"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getAllUsageData, getMonthlyUsageStats, getShootingOnlyUsageData, getBulkFilmStats } from "@/app/actions/usage";
import { Badge } from "@/components/ui/badge";
import { Film, TrendingUp, DollarSign, Calendar, Scissors } from "lucide-react";

interface OverviewStats {
  totalRollsUsed: number;
  totalRollsShot: number;
  totalCost: number;
  avgCostPerRoll: number;
  currentMonthRolls: number;
  currentMonthCost: number;
  mostUsedFilmType: string;
  totalCassettesSpooled: number;
  totalExposuresSpooled: number;
  activeBulkFilms: number;
}

export function UsageOverview() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadStats() {
      try {
        const [usageResult, monthlyResult, shootingResult, bulkStatsResult] = await Promise.all([
          getAllUsageData(),
          getMonthlyUsageStats(),
          getShootingOnlyUsageData(),
          getBulkFilmStats()
        ]);

        if (usageResult.data && monthlyResult.data && shootingResult.data) {
          const allUsage = usageResult.data;
          const shootingUsage = shootingResult.data;
          const monthlyStats = monthlyResult.data;
          const bulkStats = bulkStatsResult.data;
          
          const totalRollsUsed = allUsage.reduce((sum, usage) => sum + usage.quantity, 0);
          const totalRollsShot = shootingUsage.reduce((sum, usage) => sum + usage.quantity, 0);
          const totalCost = shootingUsage.reduce((sum, usage) => sum + usage.development_cost, 0);
          const avgCostPerRoll = totalRollsShot > 0 ? totalCost / totalRollsShot : 0;
          
          // Current month stats (shooting only)
          const currentMonth = monthlyStats[monthlyStats.length - 1];
          const currentMonthRolls = currentMonth?.rolls_used || 0;
          const currentMonthCost = currentMonth?.development_cost || 0;
          
          // Most used film type (shooting only)
          const filmTypeCounts: Record<string, number> = {};
          shootingUsage.forEach(usage => {
            filmTypeCounts[usage.development_type] = (filmTypeCounts[usage.development_type] || 0) + usage.quantity;
          });
          const mostUsedFilmType = Object.entries(filmTypeCounts)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A';

          setStats({
            totalRollsUsed,
            totalRollsShot,
            totalCost,
            avgCostPerRoll,
            currentMonthRolls,
            currentMonthCost,
            mostUsedFilmType,
            totalCassettesSpooled: bulkStats?.totalCassettesCreated || 0,
            totalExposuresSpooled: bulkStats?.totalExposuresSpooled || 0,
            activeBulkFilms: bulkStats?.activeSpooling.length || 0,
          });
        }
      } catch (error) {
        console.error('Error loading overview stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
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
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">No usage data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Rolls Shot</CardTitle>
          <Film className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRollsShot}</div>
          <p className="text-xs text-muted-foreground">
            Actually photographed
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bulk Spooling</CardTitle>
          <Scissors className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalCassettesSpooled}</div>
          <p className="text-xs text-muted-foreground">
            {stats.totalExposuresSpooled} exposures spooled
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Development Costs</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{stats.totalCost.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            Lab development costs
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">This Month</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.currentMonthRolls}</div>
          <p className="text-xs text-muted-foreground">
            €{stats.currentMonthCost.toFixed(2)} spent
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Cost/Roll</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">€{stats.avgCostPerRoll.toFixed(2)}</div>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {stats.mostUsedFilmType}
            </Badge>
            <span className="text-xs text-muted-foreground">most used</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Bulk</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.activeBulkFilms}</div>
          <p className="text-xs text-muted-foreground">
            films ready to spool
          </p>
        </CardContent>
      </Card>
    </div>
  );
}