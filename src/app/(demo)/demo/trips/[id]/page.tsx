import { getTrips } from "@/app/actions/trips";
import { TripDetails } from "@/components/trips/trip-details";
import { notFound } from "next/navigation";

export const dynamic = 'force-dynamic';

interface TripPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function DemoTripPage({ params }: TripPageProps) {
  const resolvedParams = await params;
  const { data: trips, error } = await getTrips();

  if (error) {
    return <div>Error loading trips: {error.message}</div>;
  }

  const trip = trips?.find(t => t.id === resolvedParams.id);

  if (!trip) {
    notFound();
  }

  return <TripDetails trip={trip} />;
}
