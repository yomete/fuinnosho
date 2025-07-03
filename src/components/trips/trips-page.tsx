"use client";

import { useState } from "react";
import { Trip } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NewTripForm } from "./new-trip-form";
import { EditTripForm } from "./edit-trip-form";
import { TripDetails } from "./trip-details";
import { TripTableOrGrid } from "./trip-table-or-grid";
import { Plus, Calendar } from "lucide-react";
import { EmptyState } from "@/components/empty-state";

interface TripsPageProps {
  trips: Trip[];
}

export function TripsPage({ trips }: TripsPageProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);

  if (selectedTrip) {
    return (
      <TripDetails trip={selectedTrip} onBack={() => setSelectedTrip(null)} />
    );
  }

  if (editingTrip) {
    return (
      <EditTripForm trip={editingTrip} onCancel={() => setEditingTrip(null)} />
    );
  }

  if (showNewForm) {
    return <NewTripForm onCancel={() => setShowNewForm(false)} />;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-end p-4">
        <Button onClick={() => setShowNewForm(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Trip
        </Button>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Trips</h1>
          <p className="text-muted-foreground">
            Manage your photo trips and film reservations
          </p>
        </div>
      </div>

      {trips.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={Calendar}
            title="No trips yet"
            description="Create your first trip to start managing your film reservations"
          />
          <div className="text-center">
            <Button onClick={() => setShowNewForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Your First Trip
            </Button>
          </div>
        </div>
      ) : (
        <TripTableOrGrid
          trips={trips}
          onTripSelect={setSelectedTrip}
          onTripEdit={setEditingTrip}
        />
      )}
    </div>
  );
}
