import { getRecipes } from "@/app/actions/chemistry";
import { RecipeForm } from "@/components/chemistry/recipe-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { deleteRecipe } from "@/app/actions/chemistry";
import { FlaskConical, Thermometer, Clock, Droplets, Trash2 } from "lucide-react";

async function DeleteRecipeButton({ recipeId }: { recipeId: string; recipeName: string }) {
  "use server";

  async function handleDelete() {
    "use server";
    await deleteRecipe(recipeId);
  }

  return (
    <form action={handleDelete}>
      <Button variant="ghost" size="sm" type="submit">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </form>
  );
}

export default async function RecipesPage() {
  const { data: recipes } = await getRecipes();

  return (
    <div className="max-w-7xl mx-auto space-y-4 sm:space-y-8 p-2 sm:p-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">
            Development Recipes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Save and reuse your favorite development workflows
          </p>
        </div>
        <RecipeForm />
      </div>

      {!recipes || recipes.length === 0 ? (
        <EmptyState
          icon={FlaskConical}
          title="No Recipes Saved"
          description="Create your first development recipe to quickly log development sessions"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <Card key={recipe.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{recipe.name}</CardTitle>
                  <div className="flex gap-1">
                    <RecipeForm recipe={recipe} />
                    <DeleteRecipeButton recipeId={recipe.id} recipeName={recipe.name} />
                  </div>
                </div>
                {recipe.film_type && (
                  <Badge variant="outline" className="w-fit mt-2">
                    {recipe.film_type}
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {recipe.developer && (
                  <div className="flex items-center text-sm">
                    <FlaskConical className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>
                      {recipe.developer.name}
                      {recipe.developer.brand && ` (${recipe.developer.brand})`}
                    </span>
                  </div>
                )}

                {recipe.dilution_ratio && (
                  <div className="flex items-center text-sm">
                    <Droplets className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Dilution: {recipe.dilution_ratio}</span>
                  </div>
                )}

                {recipe.temperature_celsius && (
                  <div className="flex items-center text-sm">
                    <Thermometer className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{recipe.temperature_celsius}°C</span>
                  </div>
                )}

                {recipe.development_time_minutes && (
                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{recipe.development_time_minutes} minutes</span>
                  </div>
                )}

                {recipe.agitation_pattern && (
                  <div className="text-sm text-muted-foreground border-t pt-3">
                    <span className="font-medium">Agitation: </span>
                    {recipe.agitation_pattern}
                  </div>
                )}

                {recipe.notes && (
                  <div className="text-sm text-muted-foreground border-t pt-3">
                    {recipe.notes}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
