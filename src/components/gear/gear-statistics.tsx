"use client";

import { Gear, getConditionColor, getGearTypeIcon } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface GearStatisticsProps {
  gear: Gear[];
}

export function GearStatistics({ gear }: GearStatisticsProps) {
  // Calculate statistics
  const totalGear = gear.length;
  const totalValue = gear.reduce((sum, item) => sum + (item.purchase_price || 0), 0);
  
  // Group by type
  const gearByType = gear.reduce((acc, item) => {
    acc[item.type] = (acc[item.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by condition
  const gearByCondition = gear.reduce((acc, item) => {
    acc[item.condition] = (acc[item.condition] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group by brand
  const gearByBrand = gear.reduce((acc, item) => {
    acc[item.brand] = (acc[item.brand] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topBrands = Object.entries(gearByBrand)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Gear</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalGear}</div>
            <p className="text-xs text-muted-foreground">
              items in collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{totalValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              estimated value
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              €{totalGear > 0 ? (totalValue / totalGear).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground">
              per item
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown by Type */}
      <Card>
        <CardHeader>
          <CardTitle>Gear by Type</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(gearByType).map(([type, count]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="text-lg">{getGearTypeIcon(type)}</span>
                <Badge variant="outline" className="capitalize">
                  {type}: {count}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Breakdown by Condition */}
      <Card>
        <CardHeader>
          <CardTitle>Gear by Condition</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(gearByCondition).map(([condition, count]) => (
              <Badge key={condition} className={getConditionColor(condition)}>
                {condition}: {count}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Brands */}
      <Card>
        <CardHeader>
          <CardTitle>Top Brands</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {topBrands.map(([brand, count]) => (
              <div key={brand} className="flex items-center justify-between">
                <span className="font-medium">{brand}</span>
                <Badge variant="outline">{count} items</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}