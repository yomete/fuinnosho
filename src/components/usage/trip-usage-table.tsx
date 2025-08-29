"use client";

import { useEffect, useState } from "react";
import { getTripUsageStats } from "@/app/actions/usage";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface TripUsageData {
  id: string;
  title: string;
  start_date: string;
  status: string;
  total_rolls: number;
  total_cost: number;
  film_cost: number;
  development_cost: number;
}

export function TripUsageTable() {
  const [data, setData] = useState<TripUsageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getTripUsageStats();
        if (result.data) {
          setData(result.data as TripUsageData[]);
        }
      } catch (error) {
        console.error('Error loading trip usage data:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="animate-pulse h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'default';
      case 'planned': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trip</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Rolls</TableHead>
            <TableHead className="text-right">Development Cost</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                No trip data available
              </TableCell>
            </TableRow>
          ) : (
            data.map((trip) => (
              <TableRow key={trip.id}>
                <TableCell className="font-medium">{trip.title}</TableCell>
                <TableCell>{formatDate(trip.start_date)}</TableCell>
                <TableCell>
                  <Badge variant={getStatusColor(trip.status)}>
                    {trip.status || 'planned'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">{trip.total_rolls}</TableCell>
                <TableCell className="text-right font-medium">
                  €{trip.development_cost.toFixed(2)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}