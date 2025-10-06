"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  DevelopmentRecipe,
  DevelopmentRecipeSchema,
  developmentRecipeSchema,
  ChemistryInventory,
} from "@/lib/utils";
import { createRecipe, editRecipe } from "@/app/actions/chemistry";
import { getChemistryInventory } from "@/app/actions/chemistry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit } from "lucide-react";

interface RecipeFormProps {
  recipe?: DevelopmentRecipe;
}

export function RecipeForm({ recipe }: RecipeFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [developers, setDevelopers] = useState<ChemistryInventory[]>([]);

  useEffect(() => {
    async function fetchDevelopers() {
      const { data } = await getChemistryInventory();
      if (data) {
        const devs = data.filter((c) => c.chemistry_type === "developer");
        setDevelopers(devs);
      }
    }
    if (open) {
      fetchDevelopers();
    }
  }, [open]);

  const form = useForm<DevelopmentRecipeSchema>({
    resolver: zodResolver(developmentRecipeSchema),
    defaultValues: recipe
      ? {
          name: recipe.name,
          film_type: recipe.film_type || "",
          developer_id: recipe.developer_id,
          dilution_ratio: recipe.dilution_ratio || "",
          temperature_celsius: recipe.temperature_celsius,
          development_time_minutes: recipe.development_time_minutes,
          agitation_pattern: recipe.agitation_pattern || "",
          notes: recipe.notes || "",
        }
      : {
          name: "",
          film_type: "",
          developer_id: "",
          dilution_ratio: "",
          temperature_celsius: undefined,
          development_time_minutes: undefined,
          agitation_pattern: "",
          notes: "",
        },
  });

  async function onSubmit(data: DevelopmentRecipeSchema) {
    setIsSubmitting(true);
    try {
      const result = recipe
        ? await editRecipe(recipe.id, data)
        : await createRecipe(data);

      if (result.success) {
        toast.success(
          recipe ? "Recipe updated successfully" : "Recipe created successfully"
        );
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {recipe ? (
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Recipe
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {recipe ? "Edit Recipe" : "Create New Recipe"}
          </DialogTitle>
          <DialogDescription>
            {recipe
              ? "Update your development recipe"
              : "Save a development recipe for future use"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipe Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., HP5+ in Rodinal Stand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="film_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Film Type (Optional)</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., HP5+, Tri-X, etc." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="developer_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Developer</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select developer" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {developers.map((dev) => (
                        <SelectItem key={dev.id} value={dev.id}>
                          {dev.name} {dev.brand && `(${dev.brand})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="dilution_ratio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dilution Ratio (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 1+50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperature_celsius"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temperature (°C)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="20"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="development_time_minutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="11"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="agitation_pattern"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agitation Pattern (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., 10 inversions every 30 seconds"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this recipe..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : recipe
                  ? "Update Recipe"
                  : "Create Recipe"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
