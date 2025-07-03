"use client";
import { Trip } from "@/lib/utils";
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
import { Calendar } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

interface TripTableProps {
  trips: Trip[];
  onTripSelect: (trip: Trip) => void;
  onTripEdit: (trip: Trip) => void;
}

export function TripTable({ trips, onTripSelect, onTripEdit }: TripTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

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
            <TableHead>Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {trips.map((trip) => (
            <TableRow key={trip.id}>
              <TableCell className="font-medium">{trip.title}</TableCell>
              <TableCell>{formatDate(trip.trip_date)}</TableCell>
              <TableCell>
                <Badge variant={isUpcoming(trip.trip_date) ? "secondary" : "outline"}>
                  {isUpcoming(trip.trip_date) ? "Upcoming" : "Past"}
                </Badge>
              </TableCell>
              <TableCell className="max-w-md truncate">
                {trip.description}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => onTripSelect(trip)}>
                    View Details
                  </Button>
                  {isUpcoming(trip.trip_date) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTripEdit(trip)}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}