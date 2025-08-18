"use client";
import { Trip, formatTripDateRange, formatTripDuration, getTripStatusColor } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar, Film } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";

interface TripTableProps {
  trips: Trip[];
  onTripEdit: (trip: Trip) => void;
  onTripComplete: (trip: Trip) => void;
}

export function TripTable({ trips, onTripEdit, onTripComplete }: TripTableProps) {
  if (trips.length === 0) {
    return (
      <EmptyState
        icon={Calendar}
        title="No trips yet"
        description="Create your first trip to start managing your film reservations"
      />
    );
  }

  return (
    <div className="rounded-md border p-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Dates</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Reserved Films</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-medium">{trip.title}</TableCell>
              <TableCell>{formatTripDateRange(trip.start_date, trip.end_date)}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {formatTripDuration(trip.start_date, trip.end_date)}
              </TableCell>
              <TableCell>
                <Badge className={getTripStatusColor(trip.status)}>
                  {trip.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Film className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {trip.reserved_film_count || 0}
                  </span>
                </div>
              </TableCell>
              <TableCell className="max-w-md truncate">
                {trip.description}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Link href={`/trips/${trip.id}`}>
                    <Button size="sm">View Details</Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onTripEdit(trip)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onTripComplete(trip)}
                    disabled={trip.status === 'completed'}
                  >
                    Mark as Completed
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
