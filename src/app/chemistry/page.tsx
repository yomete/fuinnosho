import { getChemistryInventory } from "@/app/actions/chemistry";
import { getFeatureFlag } from "@/app/actions/feature-flags";
import { ChemistryForm } from "@/components/chemistry/chemistry-form";
import { ChemistryCard } from "@/components/chemistry/chemistry-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmptyState } from "@/components/empty-state";
import { Beaker } from "lucide-react";

export const dynamic = 'force-dynamic';

export default async function ChemistryPage() {
  const { data: bwChemistry } = await getChemistryInventory("black_white");
  const { data: colorChemistry } = await getChemistryInventory("color");
  const colorDevelopmentEnabled = await getFeatureFlag("color_development");

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 p-2 sm:p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Chemistry Inventory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage your film development chemicals
          </p>
        </div>
      </div>

      <Tabs defaultValue="black_white" className="w-full">
        <TabsList className={colorDevelopmentEnabled ? "grid w-full grid-cols-2" : "grid w-full grid-cols-1"}>
          <TabsTrigger value="black_white">Black & White</TabsTrigger>
          {colorDevelopmentEnabled && (
            <TabsTrigger value="color">Color</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="black_white" className="space-y-4 mt-4">
          <div className="flex justify-end">
            <ChemistryForm defaultProcessType="black_white" />
          </div>

          {!bwChemistry || bwChemistry.length === 0 ? (
            <EmptyState
              icon={Beaker}
              title="No Black & White Chemistry"
              description="Add your first B&W chemistry to start tracking your development inventory"
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bwChemistry.map((chem) => (
                <ChemistryCard key={chem.id} chemistry={chem} />
              ))}
            </div>
          )}
        </TabsContent>

        {colorDevelopmentEnabled && (
          <TabsContent value="color" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <ChemistryForm defaultProcessType="color" />
            </div>

            {!colorChemistry || colorChemistry.length === 0 ? (
              <EmptyState
                icon={Beaker}
                title="No Color Chemistry"
                description="Add your first color chemistry to start tracking your C-41 or E-6 development inventory"
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {colorChemistry.map((chem) => (
                  <ChemistryCard key={chem.id} chemistry={chem} />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
