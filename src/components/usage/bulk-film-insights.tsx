"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { getBulkFilmStats, BulkFilmStats } from "@/app/actions/usage";
import { Scissors, AlertTriangle, CheckCircle2 } from "lucide-react";

export function BulkFilmInsights() {
  const [bulkStats, setBulkStats] = useState<BulkFilmStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const result = await getBulkFilmStats();
        if (result.data) {
          setBulkStats(result.data);
        }
      } catch (error) {
        console.error('Error loading bulk film stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="animate-pulse bg-gray-200 h-6 w-48 rounded"></CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 h-4 rounded"></div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!bulkStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bulk Film Insights</CardTitle>
          <CardDescription>Spooling efficiency and usage analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">
            No bulk film data available
          </p>
        </CardContent>
      </Card>
    );
  }

  const spoolingEfficiency = bulkStats.totalCassettesCreated > 0 
    ? Math.round((bulkStats.totalRollsShot / bulkStats.totalCassettesCreated) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5 text-orange-600" />
            Bulk Film Insights
          </CardTitle>
          <CardDescription>
            Track your bulk film spooling efficiency and usage patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Spooling Efficiency</span>
                <span className="text-sm text-muted-foreground">{spoolingEfficiency}%</span>
              </div>
              <Progress value={spoolingEfficiency} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {bulkStats.totalRollsShot} shot / {bulkStats.totalCassettesCreated} spooled
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {bulkStats.totalExposuresSpooled.toLocaleString()}
              </div>
              <p className="text-sm text-muted-foreground">Total exposures spooled</p>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {bulkStats.totalCassettesCreated - bulkStats.totalRollsShot}
              </div>
              <p className="text-sm text-muted-foreground">Unused cassettes ready</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              Active Bulk Films
            </CardTitle>
            <CardDescription>
              Films available for spooling
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bulkStats.activeSpooling.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No active bulk films available
              </p>
            ) : (
              <div className="space-y-3">
                {bulkStats.activeSpooling.map((film, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{film.filmName}</p>
                      <p className="text-xs text-muted-foreground">
                        {film.spooledCassettes} cassettes ready
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-blue-600">
                        {film.remainingExposures} exp
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Completed Bulk Films
            </CardTitle>
            <CardDescription>
              Films that have been fully used
            </CardDescription>
          </CardHeader>
          <CardContent>
            {bulkStats.bulkFilmsSpoiled.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                No completed bulk films yet
              </p>
            ) : (
              <div className="space-y-2">
                {bulkStats.bulkFilmsSpoiled.map((film, index) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <span className="text-sm font-medium">
                      {film.brand} {film.name}
                    </span>
                    <Badge variant="secondary" className="text-xs">
                      Finished
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}