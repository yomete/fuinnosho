import FilmInventoryGrid from "./viz/FilmInventoryGrid";
import FilmStatistics from "./viz/FilmStatistics";
import ExpirationTimeline from "./viz/ExpirationTimeline";
import DataTable from "./Table";
import { NewFilm } from "./FilmForm/NewFilm";
import AcquisitionTimeline from "./viz/acquisition-timeline";
import StorageCalculator from "./viz/storage-calculator";
import InventoryValue from "./viz/inventory-value";
import ISODistribution from "./viz/iso-distribution";
import { getFilms } from "@/app/actions/films";
import { FilmsClientWrapper } from "./FilmsClientWrapper";
import { FilmRecommendationWidget } from "@/components/dashboard/film-recommendation";
async function FilmsContent() {
  const { data: films, error } = await getFilms();

  if (error) throw error;
  if (!films) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-end p-4">
        <NewFilm />
      </div>
      <DataTable films={films} />
      <FilmInventoryGrid films={films} />
      <FilmStatistics films={films} />
      <ExpirationTimeline films={films} />
      <AcquisitionTimeline films={films} />
      <StorageCalculator films={films} />
      <InventoryValue films={films} />
      <ISODistribution films={films} />
      <FilmRecommendationWidget />
    </div>
  );
}

export default async function Films() {
  return (
    <FilmsClientWrapper>
      <FilmsContent />
    </FilmsClientWrapper>
  );
}
