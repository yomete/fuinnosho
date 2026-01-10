import FilmStatistics from "@/components/viz/film-statistics";
import ExpirationTimeline from "@/components/viz/expiration-timeline";
import { getFilmsWithAvailability } from "@/app/actions/trips";
import { FilmsClientWrapper } from "@/components/films/films-client-wrapper";
import TableOrGrid from "@/components/viz/table-or-grid";
import { NewFilm } from "@/components/film-form/new-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilmsSummary } from "@/components/films/films-summary";
import { DeletedFilmsSection } from "@/components/films/deleted-films-section";

async function FilmsContent() {
  const { data: films, error } = await getFilmsWithAvailability();

  if (error) throw error;
  if (!films) return null;

  // Calculate available rolls for subtitle
  const availableRolls = films.reduce((sum, f) => {
    if (typeof f.available_count === "number" && f.available_count >= 0) {
      return sum + f.available_count;
    }
    if (typeof f.total_count === "number" && f.total_count >= 0) {
      return sum + f.total_count;
    }
    return sum + (f.count || 1);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 px-2 sm:px-0">
        <div>
          <h1
            className="text-3xl sm:text-4xl font-light tracking-tight text-[#e8e4e0] mb-1"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Film Inventory
          </h1>
          <p className="text-[#8a8078] text-base sm:text-lg">
            {availableRolls} rolls ready to shoot
          </p>
        </div>
        <NewFilm />
      </header>

      {/* Summary Stats */}
      <div className="px-2 sm:px-0">
        <FilmsSummary films={films} />
      </div>

      {/* Film Table/Grid */}
      <TableOrGrid films={films} />

      {/* Additional Stats in Tabs */}
      <Tabs defaultValue="overview" className="w-full px-2 sm:px-0">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="text-xs sm:text-sm">
            Detailed Stats
          </TabsTrigger>
          <TabsTrigger value="timeline" className="text-xs sm:text-sm">
            Expiration Timeline
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <FilmStatistics films={films} />
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <ExpirationTimeline films={films} />
        </TabsContent>
      </Tabs>

      {/* Deleted Films Section */}
      <DeletedFilmsSection />
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
