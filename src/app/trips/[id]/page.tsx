import { getTrips } from "@/app/actions/trips";
import { TripDetails } from "@/components/trips/trip-details";
import { notFound } from "next/navigation";
import { Metadata } from "next";

interface TripPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: TripPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { data: trips, error } = await getTrips();
  
  if (error || !trips) {
    return {
      title: "Trip - Fuinnosho"
    };
  }

  const trip = trips.find(t => t.id === resolvedParams.id);
  
  if (!trip) {
    return {
      title: "Trip Not Found - Fuinnosho"
    };
  }

  return {
    title: `${trip.title} - Fuinnosho`
  };
}

export default async function TripPage({ params }: TripPageProps) {
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