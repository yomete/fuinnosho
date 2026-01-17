import { getTrips } from "@/app/actions/trips";
import { TripsPage } from "@/components/trips/trips-page";

export const dynamic = 'force-dynamic';

export default async function Page() {
  const { data: trips, error } = await getTrips();

  if (error) {
    return <div>Error loading trips: {error.message}</div>;
  }

  return <TripsPage trips={trips || []} />;
}