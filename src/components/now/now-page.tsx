import { getNowBoard } from "@/app/actions/loaded";
import { getTrips } from "@/app/actions/trips";
import { NowBoard } from "@/components/now/now-board";
import { NowClientWrapper } from "@/components/now/now-client-wrapper";

async function NowContent() {
  const [board, tripsResult] = await Promise.all([getNowBoard(), getTrips()]);

  if (!board.success || !board.data) {
    throw new Error(board.error || "Failed to load what's in your cameras");
  }

  // Completed trips can't take new usage, so they're not worth offering.
  const trips = (tripsResult.data ?? []).filter(
    (trip) => trip.status !== "completed"
  );

  return (
    <NowBoard
      cameras={board.data.cameras}
      loaded={board.data.loaded}
      availableFilms={board.data.availableFilms}
      eiPrefills={board.data.eiPrefills}
      trips={trips}
    />
  );
}

export default async function NowPage() {
  return (
    <NowClientWrapper>
      <NowContent />
    </NowClientWrapper>
  );
}
