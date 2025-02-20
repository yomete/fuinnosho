import { mockFilms } from "./utils";
import FilmInventoryGrid from "./FilmInventoryGrid";
import FilmStatistics from "./FilmStatistics";
import ExpirationTimeline from "./ExpirationTimeline";
import DataTable from "./Table";
import { NewFilm } from "./NewFilm";
import AcquisitionTimeline from "./acquisition-timeline";
import StorageCalculator from "./storage-calculator";
import InventoryValue from "./inventory-value";
import ISODistribution from "./iso-distribution";

export default function Demo() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-end p-4">
        <NewFilm />
      </div>
      <DataTable films={mockFilms} />
      <FilmInventoryGrid films={mockFilms} />
      <FilmStatistics films={mockFilms} />
      <ExpirationTimeline films={mockFilms} />
      <AcquisitionTimeline films={mockFilms} />
      <StorageCalculator films={mockFilms} />
      <InventoryValue films={mockFilms} />
      <ISODistribution films={mockFilms} />
    </div>
  );
}
