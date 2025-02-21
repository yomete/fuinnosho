import FilmInventoryGrid from "@/components/dashboard/films/viz/film-inventory-grid";
import FilmStatistics from "@/components/dashboard/films/viz/film-statistics";
import ExpirationTimeline from "@/components/dashboard/films/viz/expiration-timeline";
import DataTable from "@/components/dashboard/films/table";
import { NewFilm } from "@/components/dashboard/films/film-form/new-form";
import AcquisitionTimeline from "@/components/dashboard/films/viz/acquisition-timeline";
import StorageCalculator from "@/components/dashboard/films/viz/storage-calculator";
import InventoryValue from "@/components/dashboard/films/viz/inventory-value";
import ISODistribution from "@/components/dashboard/films/viz/iso-distribution";
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
