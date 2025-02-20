import { mockFilms } from "./utils";
import FilmInventoryGrid from "./FilmInventoryGrid";
import FilmStatistics from "./FilmStatistics";
import ExpirationTimeline from "./ExpirationTimeline";
import DataTable from "./Table";
import { NewFilm } from "./NewFilm";

export default function Demo() {
  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-end p-4">
        <NewFilm />
      </div>
      <FilmInventoryGrid films={mockFilms} />
      <FilmStatistics films={mockFilms} />
      <ExpirationTimeline films={mockFilms} />
      <DataTable films={mockFilms} />
    </div>
  );
}
