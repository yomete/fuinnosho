"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WeeklyUsageChart } from "./weekly-usage-chart";
import { MonthlyUsageChart } from "./monthly-usage-chart";
import { CostBreakdown } from "./cost-breakdown";
import { FilmTypeDistribution } from "./film-type-distribution";
import { TripUsageTable } from "./trip-usage-table";
import { UsageOverview } from "./usage-overview";

export function UsageAnalytics() {
  return (
    <div className="space-y-6">
      <UsageOverview />
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="weekly">Weekly</TabsTrigger>
          <TabsTrigger value="monthly">Monthly</TabsTrigger>
          <TabsTrigger value="trips">Trips</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CostBreakdown />
            <FilmTypeDistribution />
          </div>
        </TabsContent>
        
        <TabsContent value="weekly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Weekly Usage Trends</CardTitle>
              <CardDescription>
                Your film consumption and lab development costs over the last 12 weeks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <WeeklyUsageChart />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Usage Analysis</CardTitle>
              <CardDescription>
                Monthly film usage patterns and lab development spending over the last 12 months
              </CardDescription>
            </CardHeader>
            <CardContent>
              <MonthlyUsageChart />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="trips" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Trip Usage & Costs</CardTitle>
              <CardDescription>
                Film usage and development costs broken down by photography trips
              </CardDescription>
            </CardHeader>
            <CardContent>
              <TripUsageTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}