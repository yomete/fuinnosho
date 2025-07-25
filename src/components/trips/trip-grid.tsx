"use client";
import { Trip, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Film } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import Link from "next/link";

interface TripGridProps {
  trips: Trip[];
  onTripEdit: (trip: Trip) => void;
}

export function TripGrid({ trips, onTripEdit }: TripGridProps) {

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const upcomingTrips = trips.filter((trip) => isUpcoming(trip.trip_date));
  const pastTrips = trips.filter((trip) => !isUpcoming(trip.trip_date));

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
    <div className="space-y-8">
      {upcomingTrips.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Trips
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTrips.map((trip) => (
              <Card
                key={trip.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{trip.title}</CardTitle>
                      <CardDescription className="flex items-center mt-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {formatDate(trip.trip_date)}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary">Upcoming</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {trip.description}
                  </p>
                  <div className="flex items-center gap-1 mt-3 mb-2">
                    <Film className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{trip.reserved_film_count || 0} films reserved</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/trips/${trip.id}`}>
                      <Button size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onTripEdit(trip)}
                    >
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {pastTrips.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Past Trips</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {pastTrips.map((trip) => (
              <Card
                key={trip.id}
                className="cursor-pointer hover:shadow-md transition-shadow opacity-75"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{trip.title}</CardTitle>
                      <CardDescription className="flex items-center mt-2">
                        <MapPin className="h-4 w-4 mr-1" />
                        {formatDate(trip.trip_date)}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">Past</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {trip.description}
                  </p>
                  <div className="flex items-center gap-1 mt-3 mb-2">
                    <Film className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{trip.reserved_film_count || 0} films reserved</span>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link href={`/trips/${trip.id}`}>
                      <Button size="sm">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}