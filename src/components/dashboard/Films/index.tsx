import FilmStatistics from "@/components/viz/film-statistics";
import ExpirationTimeline from "@/components/viz/expiration-timeline";
import StorageCalculator from "@/components/viz/storage-calculator";
import InventoryValue from "@/components/viz/inventory-value";
import ISODistribution from "@/components/viz/iso-distribution";
import { getFilms } from "@/app/actions/films";
import { FilmsClientWrapper } from "@/components/dashboard/films/films-client-wrapper";
import { FilmRecommendationWidget } from "@/components/dashboard/film-recommendation";
import TableOrGrid from "@/components/viz/table-or-grid";
import { NewFilm } from "@/components/film-form/new-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function FilmsContent() {
  const { data: films, error } = await getFilms();

  if (error) throw error;
  if (!films) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-end p-4">
        <NewFilm />
      </div>

      <TableOrGrid films={films} />

      <Tabs defaultValue="overview" className="w-full p-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="storage">Storage</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FilmStatistics films={films} />
        </TabsContent>

        <TabsContent value="timeline">
          <ExpirationTimeline films={films} />
        </TabsContent>

        <TabsContent value="storage">
          <div className="space-y-8">
            <StorageCalculator films={films} />
            <InventoryValue films={films} />
          </div>
        </TabsContent>

        <TabsContent value="analysis">
          <div className="space-y-8">
            <ISODistribution films={films} />
            <FilmRecommendationWidget />
          </div>
        </TabsContent>
      </Tabs>
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
