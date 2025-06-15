"use client";

import { useState } from "react";
import { Trip } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NewTripForm } from "./new-trip-form";
import { EditTripForm } from "./edit-trip-form";
import { TripDetails } from "./trip-details";
import { Plus, Calendar, MapPin } from "lucide-react";

interface TripsPageProps {
  trips: Trip[];
}

export function TripsPage({ trips }: TripsPageProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  const upcomingTrips = trips.filter(trip => isUpcoming(trip.trip_date));
  const pastTrips = trips.filter(trip => !isUpcoming(trip.trip_date));

  if (selectedTrip) {
    return (
      <TripDetails 
        trip={selectedTrip} 
        onBack={() => setSelectedTrip(null)} 
      />
    );
  }

  if (editingTrip) {
    return (
      <EditTripForm 
        trip={editingTrip} 
        onCancel={() => setEditingTrip(null)} 
      />
    );
  }

  if (showNewForm) {
    return <NewTripForm onCancel={() => setShowNewForm(false)} />;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trips</h1>
          <p className="text-muted-foreground">Manage your photo trips and film reservations</p>
        </div>
        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Trip
        </Button>
      </div>

      {upcomingTrips.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Upcoming Trips
          </h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {upcomingTrips.map((trip) => (
              <Card key={trip.id} className="cursor-pointer hover:shadow-md transition-shadow">
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
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedTrip(trip)}
                    >
                      View Details
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingTrip(trip)}
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
              <Card key={trip.id} className="cursor-pointer hover:shadow-md transition-shadow opacity-75">
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
                  <div className="flex gap-2 mt-4">
                    <Button 
                      size="sm" 
                      onClick={() => setSelectedTrip(trip)}
                    >
                      View Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {trips.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No trips yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first trip to start managing your film reservations
          </p>
          <Button onClick={() => setShowNewForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Trip
          </Button>
        </div>
      )}
    </div>
  );
}