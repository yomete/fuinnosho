import FilmStatistics from "@/components/viz/film-statistics";
import ExpirationTimeline from "@/components/viz/expiration-timeline";
import { FilmUsageStats } from "@/components/viz/film-usage-stats";
import { getFilms } from "@/app/actions/films";
import { FilmsClientWrapper } from "@/components/films/films-client-wrapper";
import TableOrGrid from "@/components/viz/table-or-grid";
import { NewFilm } from "@/components/film-form/new-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function FilmsContent() {
  const { data: films, error } = await getFilms();

  if (error) throw error;
  if (!films) return null;

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Films</h1>
          <p className="text-muted-foreground">Manage your film inventory and track usage</p>
        </div>
        <NewFilm />
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        <TableOrGrid films={films} />

      <Tabs defaultValue="overview" className="w-full p-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="usage">Usage</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <FilmStatistics films={films} />
        </TabsContent>

        <TabsContent value="usage">
          <FilmUsageStats films={films} />
        </TabsContent>

        <TabsContent value="timeline">
          <ExpirationTimeline films={films} />
        </TabsContent>
      </Tabs>
      </div>
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
