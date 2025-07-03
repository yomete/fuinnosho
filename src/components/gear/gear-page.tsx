import { getGear } from "@/app/actions/gear";
import { GearClientWrapper } from "@/components/gear/gear-client-wrapper";
import { GearTableOrGrid } from "@/components/gear/gear-table-or-grid";
import { NewGear } from "@/components/gear/new-gear-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GearStatistics } from "@/components/gear/gear-statistics";

async function GearContent() {
  const { success, gear, error } = await getGear();

  if (!success || error) {
    throw new Error(error || "Failed to load gear");
  }

  if (!gear) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex justify-end p-4">
        <NewGear />
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Gear</h1>
          <p className="text-muted-foreground">
            Manage your photography equipment collection
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        <GearTableOrGrid gear={gear} />

        <Tabs defaultValue="overview" className="w-full p-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="by-type">By Type</TabsTrigger>
            <TabsTrigger value="condition">Condition</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <GearStatistics gear={gear} />
          </TabsContent>

          <TabsContent value="by-type">
            <div className="text-center py-8 text-muted-foreground">
              Type breakdown coming soon
            </div>
          </TabsContent>

          <TabsContent value="condition">
            <div className="text-center py-8 text-muted-foreground">
              Condition analysis coming soon
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default async function GearPage() {
  return (
    <GearClientWrapper>
      <GearContent />
    </GearClientWrapper>
  );
}
