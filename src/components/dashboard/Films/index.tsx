import FilmInventoryGrid from "@/components/viz/film-inventory-grid";
import FilmStatistics from "@/components/viz/film-statistics";
import ExpirationTimeline from "@/components/viz/expiration-timeline";
import DataTable from "@/components/table";
import { NewFilm } from "@/components/film-form/new-form";
import AcquisitionTimeline from "@/components/viz/acquisition-timeline";
import StorageCalculator from "@/components/viz/storage-calculator";
import InventoryValue from "@/components/viz/inventory-value";
import ISODistribution from "@/components/viz/iso-distribution";
import { getFilms } from "@/app/actions/films";
import { FilmsClientWrapper } from "@/components/dashboard/films/films-client-wrapper";
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
