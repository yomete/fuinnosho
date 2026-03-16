"use client";

import { useEffect, useState } from "react";
import { MapPin, Calendar } from "lucide-react";
import { seedTrips, seedTripFilms, seedTripGear } from "@/lib/seed-data";

interface TripData {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: "upcoming" | "ongoing" | "past" | "completed";
}

export function DemoTripsContent() {
  const [trips, setTrips] = useState<TripData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use seed data directly for the demo panel
    setTrips(seedTrips as TripData[]);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const upcomingTrips = trips.filter(
    (t) => t.status === "upcoming" || t.status === "ongoing"
  );
  const pastTrips = trips.filter(
    (t) => t.status === "past" || t.status === "completed"
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard label="Upcoming" value={upcomingTrips.length} />
        <StatCard label="Past" value={pastTrips.length} />
      </div>

      {/* Trip List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-lg bg-[#1a1614] border border-[#2a2420]">
      <div className="text-xl text-[#e8e4e0] font-light">{value}</div>
      <div className="text-xs text-[#6a6460]">{label}</div>
    </div>
  );
}

function TripCard({ trip }: { trip: TripData }) {
  const filmCount = seedTripFilms.filter((tf) => tf.trip_id === trip.id).length;
  const gearCount = seedTripGear.filter((tg) => tg.trip_id === trip.id).length;

  const statusColors = {
    upcoming: "bg-emerald-500/20 text-emerald-500 border-emerald-500/30",
    ongoing: "bg-amber-500/20 text-amber-500 border-amber-500/30",
    past: "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
    completed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-500/5 to-emerald-600/5 border border-[#2a2420] hover:border-[#3a3430] transition-colors">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-emerald-500" />
          <span
            className="text-[#e8e4e0] text-sm"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {trip.title}
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[trip.status]}`}
        >
          {trip.status}
        </span>
      </div>
      <p className="text-xs text-[#6a6460] mb-2 line-clamp-1">
        {trip.description}
      </p>
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1 text-[#8a8078]">
          <Calendar className="w-3 h-3" />
          <span>
            {formatDate(trip.start_date)} - {formatDate(trip.end_date)}
          </span>
        </div>
        <span className="text-[#6a6460]">
          {filmCount} films · {gearCount} gear
        </span>
      </div>
    </div>
  );
}
