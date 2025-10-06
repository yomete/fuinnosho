"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Film,
  ChemistryInventory,
  DevelopmentRecipe,
  DevelopmentSessionSchema,
  developmentSessionSchema,
  getChemistryTypeColor,
  canReuseChemistry,
} from "@/lib/utils";
import {
  getFilmsFromCompletedTrips,
  createDevelopmentSession,
  markFilmsAsExternallyDeveloped,
} from "@/app/actions/development";
import { getChemistryInventory, getRecipes } from "@/app/actions/chemistry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  ChevronLeft,
  ChevronRight,
  Check,
  AlertTriangle,
  Film as FilmIcon,
  FlaskConical,
} from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { useRouter } from "next/navigation";

const STEPS = [
  { id: 1, name: "Select Films", description: "Choose films to develop" },
  { id: 2, name: "Recipe", description: "Choose recipe or manual entry" },
  { id: 3, name: "Chemistry", description: "Log chemistry used" },
  { id: 4, name: "Review", description: "Review and submit" },
];

interface DevelopClientProps {
  colorDevelopmentEnabled: boolean;
}

export default function DevelopClient({ colorDevelopmentEnabled }: DevelopClientProps) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [processType, setProcessType] = useState<"black_white" | "color">(
    "black_white"
  );
  const [films, setFilms] = useState<Film[]>([]);
  const [selectedFilms, setSelectedFilms] = useState<string[]>([]);
  const [filmQuantities, setFilmQuantities] = useState<Record<string, number>>({});
  const [chemistry, setChemistry] = useState<ChemistryInventory[]>([]);
  const [recipes, setRecipes] = useState<DevelopmentRecipe[]>([]);
  const [selectedRecipe, setSelectedRecipe] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [labDevFilm, setLabDevFilm] = useState<{ film: Film; maxQuantity: number } | null>(null);
  const [labDevQuantity, setLabDevQuantity] = useState(1);

  const form = useForm<DevelopmentSessionSchema>({
    resolver: zodResolver(developmentSessionSchema),
    defaultValues: {
      session_date: new Date().toISOString().split("T")[0],
      process_type: processType,
      temperature_celsius: undefined,
      notes: "",
      film_ids: [],
      chemistry_usage: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "chemistry_usage",
  });

  // Load films when process type changes
  useEffect(() => {
    async function loadFilms() {
      setIsLoading(true);
      const { data } = await getFilmsFromCompletedTrips(processType);
      setFilms(data || []);
      setIsLoading(false);
    }
    loadFilms();
  }, [processType]);

  // Reload films helper
  const reloadFilms = async () => {
    setIsLoading(true);
    const { data } = await getFilmsFromCompletedTrips(processType);
    setFilms(data || []);
    setIsLoading(false);
  };

  // Load chemistry and recipes when step changes
  useEffect(() => {
    async function loadData() {
      const [chemData, recipeData] = await Promise.all([
        getChemistryInventory(processType),
        getRecipes(),
      ]);
      setChemistry(chemData.data || []);
      setRecipes(
        (recipeData.data || []).filter(
          (r) => r.developer?.process_type === processType
        )
      );
    }
    if (currentStep >= 2) {
      loadData();
    }
  }, [currentStep, processType]);

  // Apply recipe when selected
  useEffect(() => {
    if (selectedRecipe && recipes.length > 0) {
      const recipe = recipes.find((r) => r.id === selectedRecipe);
      if (recipe) {
        form.setValue("temperature_celsius", recipe.temperature_celsius);
        // Pre-fill developer chemistry
        if (fields.length === 0 && recipe.developer) {
          append({
            chemistry_id: recipe.developer_id,
            volume_used_ml: 0,
            dilution_ratio: recipe.dilution_ratio || "",
            development_time_minutes: recipe.development_time_minutes,
            notes: "",
          });
        }
      }
    }
  }, [selectedRecipe, recipes, form, append, fields.length]);

  const handleFilmToggle = (filmId: string) => {
    setSelectedFilms((prev) => {
      const isSelected = prev.includes(filmId);
      if (isSelected) {
        // Remove film and its quantity
        setFilmQuantities((quantities) => {
          const newQuantities = { ...quantities };
          delete newQuantities[filmId];
          return newQuantities;
        });
        return prev.filter((id) => id !== filmId);
      } else {
        // Add film with default quantity of 1
        setFilmQuantities((quantities) => ({
          ...quantities,
          [filmId]: 1,
        }));
        return [...prev, filmId];
      }
    });
  };

  const handleQuantityChange = (filmId: string, quantity: number) => {
    setFilmQuantities((prev) => ({
      ...prev,
      [filmId]: quantity,
    }));
  };

  const openLabDevDialog = (film: Film, maxQuantity: number) => {
    setLabDevFilm({ film, maxQuantity });
    setLabDevQuantity(maxQuantity); // Default to all rolls
  };

  const handleConfirmLabDev = async () => {
    if (!labDevFilm) return;

    try {
      const result = await markFilmsAsExternallyDeveloped(
        labDevFilm.film.id,
        labDevQuantity,
        processType
      );

      if (result.success) {
        toast.success(`Marked ${labDevQuantity} roll${labDevQuantity > 1 ? 's' : ''} as externally developed`);
        setLabDevFilm(null);
        // Refresh the films list
        await reloadFilms();
      } else {
        toast.error(result.error || "Failed to mark as externally developed");
      }
    } catch {
      toast.error("An unexpected error occurred");
    }
  };

  const handleNext = () => {
    if (currentStep === 1) {
      if (selectedFilms.length === 0) {
        toast.error("Please select at least one film");
        return;
      }
      form.setValue("film_ids", selectedFilms);
      form.setValue("film_quantities", filmQuantities);
      form.setValue("process_type", processType);
    }
    setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const addChemistry = () => {
    append({
      chemistry_id: "",
      volume_used_ml: 0,
      dilution_ratio: "",
      development_time_minutes: undefined,
      notes: "",
    });
  };

  async function onSubmit(data: DevelopmentSessionSchema) {
    setIsSubmitting(true);
    try {
      const result = await createDevelopmentSession(data);
      if (result.success) {
        toast.success("Development session created successfully!");
        router.push("/develop/history");
      } else {
        toast.error(result.error || "Failed to create session");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  const calculateTotalCost = () => {
    let total = 0;
    fields.forEach((field) => {
      const chem = chemistry.find((c) => c.id === field.chemistry_id);
      if (chem && chem.cost) {
        const costPerMl = chem.cost / chem.original_volume_ml;
        total += costPerMl * field.volume_used_ml;
      }
    });
    return total;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 p-2 sm:p-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Develop Film</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Log a development session for your exposed films
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  currentStep > step.id
                    ? "bg-green-500 text-white"
                    : currentStep === step.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {currentStep > step.id ? (
                  <Check className="h-5 w-5" />
                ) : (
                  step.id
                )}
              </div>
              <div className="text-xs mt-2 text-center hidden sm:block">
                {step.name}
              </div>
            </div>
            {index < STEPS.length - 1 && (
              <div
                className={`h-1 flex-1 mx-2 ${
                  currentStep > step.id ? "bg-green-500" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          {/* Step 1: Select Films */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Select Films to Develop</CardTitle>
                <CardDescription>
                  Choose films from completed trips that are ready for
                  development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={processType}
                  onValueChange={(v) =>
                    setProcessType(v as "black_white" | "color")
                  }
                >
                  <TabsList className={colorDevelopmentEnabled ? "grid w-full grid-cols-2 mb-4" : "grid w-full grid-cols-1 mb-4"}>
                    <TabsTrigger value="black_white">Black & White</TabsTrigger>
                    {colorDevelopmentEnabled && (
                      <TabsTrigger value="color">Color</TabsTrigger>
                    )}
                  </TabsList>

                  <TabsContent value={processType}>
                    {isLoading ? (
                      <div className="text-center py-8">Loading films...</div>
                    ) : films.length === 0 ? (
                      <EmptyState
                        icon={FilmIcon}
                        title="No Films Ready to Develop"
                        description={`No ${
                          processType === "black_white"
                            ? "black & white"
                            : "color"
                        } films found from completed trips`}
                      />
                    ) : (
                      <div className="space-y-2">
                        {films.map((film) => {
                          const maxQuantity = film.count || 1;
                          const isSelected = selectedFilms.includes(film.id);

                          return (
                            <div
                              key={film.id}
                              className="p-3 border rounded-lg hover:bg-muted/50"
                            >
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => handleFilmToggle(film.id)}
                                />
                                <div className="flex-1">
                                  <div className="font-medium">{film.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {film.brand} • {film.iso} ISO • {film.format}
                                    {maxQuantity >= 1 && (
                                      <span className="ml-2">
                                        • {maxQuantity}{" "}
                                        {maxQuantity === 1 ? "roll" : "rolls"} available
                                      </span>
                                    )}
                                  </div>
                                  {film.trips && film.trips.length > 0 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      From: {film.trips.map((trip, idx) => (
                                        <span key={trip.id}>
                                          {trip.title} ({trip.quantity})
                                          {idx < film.trips!.length - 1 ? ", " : ""}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <Badge variant="outline">{film.type}</Badge>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-xs h-7"
                                    onClick={() => openLabDevDialog(film, maxQuantity)}
                                  >
                                    Mark as lab developed
                                  </Button>
                                </div>
                              </div>

                              {isSelected && maxQuantity > 1 && (
                                <div className="mt-3 ml-8 flex items-center gap-2">
                                  <label className="text-sm text-muted-foreground">
                                    Develop:
                                  </label>
                                  <Select
                                    value={String(filmQuantities[film.id] || 1)}
                                    onValueChange={(value) => handleQuantityChange(film.id, Number(value))}
                                  >
                                    <SelectTrigger className="w-24">
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Array.from({ length: maxQuantity }, (_, i) => i + 1).map((num) => (
                                        <SelectItem key={num} value={String(num)}>
                                          {num} {num === 1 ? "roll" : "rolls"}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {selectedFilms.length > 0 && (
                      <div className="mt-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium">
                          {selectedFilms.length} film
                          {selectedFilms.length > 1 ? "s" : ""} selected
                          {" • "}
                          {Object.values(filmQuantities).reduce((sum, qty) => sum + qty, 0)} total{" "}
                          {Object.values(filmQuantities).reduce((sum, qty) => sum + qty, 0) === 1 ? "roll" : "rolls"}
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Choose Recipe */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Choose Development Method</CardTitle>
                <CardDescription>
                  Select a saved recipe or continue with manual entry
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {recipes.length > 0 && (
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Use Saved Recipe (Optional)
                    </label>
                    <Select
                      value={selectedRecipe || undefined}
                      onValueChange={setSelectedRecipe}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a recipe or continue manually" />
                      </SelectTrigger>
                      <SelectContent>
                        {recipes.map((recipe) => (
                          <SelectItem key={recipe.id} value={recipe.id}>
                            {recipe.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="session_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
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
                      <FormLabel>Temperature (°C) - Optional</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="20"
                          {...field}
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
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
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Notes - Optional</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Overall notes about this development session..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {/* Step 3: Log Chemistry */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Log Chemistry Used</CardTitle>
                <CardDescription>
                  Add each chemistry used in the development process
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fields.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <EmptyState
                      icon={FlaskConical}
                      title="No Chemistry Added"
                      description="Add the chemistry used in your development process"
                    />
                    <Button
                      onClick={addChemistry}
                      type="button"
                      className="mt-4"
                    >
                      Add Chemistry
                    </Button>
                  </div>
                ) : (
                  fields.map((field, idx) => {
                    const selectedChem = chemistry.find(
                      (c) => c.id === field.chemistry_id
                    );
                    const hasWarning =
                      selectedChem &&
                      (!canReuseChemistry(selectedChem) ||
                        selectedChem.volume_ml < field.volume_used_ml);

                    return (
                      <Card
                        key={field.id}
                        className={hasWarning ? "border-yellow-500" : ""}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-center">
                            <CardTitle className="text-base">
                              Chemistry #{idx + 1}
                            </CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(idx)}
                            >
                              Remove
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <FormField
                            control={form.control}
                            name={`chemistry_usage.${idx}.chemistry_id`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chemistry</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  defaultValue={field.value}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select chemistry" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {chemistry.map((chem) => (
                                      <SelectItem key={chem.id} value={chem.id}>
                                        <div className="flex items-center gap-2">
                                          <Badge
                                            className={getChemistryTypeColor(
                                              chem.chemistry_type
                                            )}
                                          >
                                            {chem.chemistry_type.replace(
                                              "_",
                                              " "
                                            )}
                                          </Badge>
                                          {chem.name} ({chem.volume_ml}ml left)
                                        </div>
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {selectedChem && (
                            <div className="text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Available:
                                </span>
                                <span>{selectedChem.volume_ml}ml</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">
                                  Uses:
                                </span>
                                <span>
                                  {selectedChem.times_used}/
                                  {selectedChem.max_reuses}
                                </span>
                              </div>
                              {!canReuseChemistry(selectedChem) && (
                                <div className="flex items-center gap-1 text-yellow-600">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>Max reuses reached</span>
                                </div>
                              )}
                            </div>
                          )}

                          <div className="grid grid-cols-2 gap-3">
                            <FormField
                              control={form.control}
                              name={`chemistry_usage.${idx}.volume_used_ml`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Volume Used (ml)</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      step="0.1"
                                      {...field}
                                      onChange={(e) =>
                                        field.onChange(
                                          parseFloat(e.target.value)
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
                              name={`chemistry_usage.${idx}.dilution_ratio`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Dilution (Optional)</FormLabel>
                                  <FormControl>
                                    <Input placeholder="1+50" {...field} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          <FormField
                            control={form.control}
                            name={`chemistry_usage.${idx}.development_time_minutes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Time (minutes) - Optional</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    {...field}
                                    value={field.value || ""}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value
                                          ? parseFloat(e.target.value)
                                          : undefined
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
                            name={`chemistry_usage.${idx}.notes`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Notes - Optional</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Notes about this chemistry..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </CardContent>
                      </Card>
                    );
                  })
                )}

                {fields.length > 0 && (
                  <Button
                    onClick={addChemistry}
                    type="button"
                    variant="outline"
                    className="w-full"
                  >
                    Add Another Chemistry
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Review */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Review Session</CardTitle>
                <CardDescription>
                  Review your development session before submitting
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Films */}
                <div>
                  <h3 className="font-semibold mb-2">
                    Films ({selectedFilms.length}) • {Object.values(filmQuantities).reduce((sum, qty) => sum + qty, 0)} total rolls
                  </h3>
                  <div className="space-y-2">
                    {films
                      .filter((f) => selectedFilms.includes(f.id))
                      .map((film) => {
                        const quantity = filmQuantities[film.id] || 1;
                        return (
                          <div
                            key={film.id}
                            className="p-2 bg-muted rounded-lg text-sm"
                          >
                            {film.name} - {film.brand} • {film.iso} ISO
                            {quantity > 1 && (
                              <span className="ml-2 font-medium">
                                ({quantity} rolls)
                              </span>
                            )}
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Session Details */}
                <div>
                  <h3 className="font-semibold mb-2">Session Details</h3>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{form.getValues("session_date")}</span>
                    </div>
                    {form.getValues("temperature_celsius") && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Temperature:
                        </span>
                        <span>{form.getValues("temperature_celsius")}°C</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Process:</span>
                      <span>
                        {processType === "black_white"
                          ? "Black & White"
                          : "Color"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Chemistry Used */}
                <div>
                  <h3 className="font-semibold mb-2">Chemistry Used</h3>
                  <div className="space-y-2">
                    {fields.map((field) => {
                      const chem = chemistry.find(
                        (c) => c.id === field.chemistry_id
                      );
                      return (
                        <div key={field.id} className="p-3 bg-muted rounded-lg">
                          <div className="flex justify-between items-start">
                            <div>
                              <div className="font-medium">{chem?.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {field.volume_used_ml}ml
                                {field.dilution_ratio &&
                                  ` @ ${field.dilution_ratio}`}
                                {field.development_time_minutes &&
                                  ` for ${field.development_time_minutes}min`}
                              </div>
                            </div>
                            <Badge
                              className={getChemistryTypeColor(
                                chem?.chemistry_type || "other"
                              )}
                            >
                              {chem?.chemistry_type.replace("_", " ")}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">
                      Total Estimated Cost
                    </span>
                    <span className="text-2xl font-bold">
                      ${calculateTotalCost().toFixed(2)}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    ~${(calculateTotalCost() / selectedFilms.length).toFixed(2)}{" "}
                    per roll
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={handleBack}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            {currentStep < STEPS.length ? (
              <Button type="button" onClick={handleNext}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Session"}
              </Button>
            )}
          </div>
        </form>
      </Form>

      {/* Lab Development Dialog */}
      <Dialog open={!!labDevFilm} onOpenChange={(open) => !open && setLabDevFilm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark as Lab Developed</DialogTitle>
            <DialogDescription>
              Mark this film as developed externally (e.g., by a lab). It will be removed from the development queue.
            </DialogDescription>
          </DialogHeader>

          {labDevFilm && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="font-medium">{labDevFilm.film.name}</div>
                <div className="text-sm text-muted-foreground">
                  {labDevFilm.film.brand} • {labDevFilm.film.iso} ISO • {labDevFilm.film.format}
                </div>
              </div>

              {labDevFilm.maxQuantity > 1 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Number of rolls developed</label>
                  <Select
                    value={String(labDevQuantity)}
                    onValueChange={(value) => setLabDevQuantity(Number(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: labDevFilm.maxQuantity }, (_, i) => i + 1).map((num) => (
                        <SelectItem key={num} value={String(num)}>
                          {num} {num === 1 ? 'roll' : 'rolls'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setLabDevFilm(null)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmLabDev}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
