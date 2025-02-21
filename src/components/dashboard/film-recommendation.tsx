"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { getFilmRecommendation } from "@/app/actions/get-film-recommendation";
import {
  FilmRecommendation,
  WeatherConditions,
  ShootingScenario,
} from "@/types/recommendation";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface FilmPreferences {
  format: "35mm" | "120" | "large-format";
  colorPreference: "color" | "black-and-white" | "either";
  grainPreference: "fine" | "medium" | "chunky";
  specialEffects: boolean;
}

const LoadingSpinner = () => {
  return (
    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-gray-900 dark:border-white" />
  );
};

export function FilmRecommendationWidget() {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendation, setRecommendation] =
    useState<FilmRecommendation | null>(null);

  const [weather, setWeather] = useState<WeatherConditions>({
    temperature: 20,
    isOvercast: false,
    lightLevel: "moderate",
    timeOfDay: "afternoon",
  });

  const [scenario, setScenario] = useState<ShootingScenario>({
    type: "portrait",
    environment: "outdoor",
    movement: "static",
  });

  const [preferences, setPreferences] = useState<FilmPreferences>({
    format: "35mm",
    colorPreference: "either",
    grainPreference: "medium",
    specialEffects: false,
  });

  async function handleGetRecommendation() {
    try {
      setIsLoading(true);
      const result = await getFilmRecommendation(weather, scenario);
      setRecommendation(result);
    } catch (error) {
      console.error(error);
      // You might want to add toast notification here
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Film Stock Recommendation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Weather Conditions</h3>
            <div className="grid gap-4">
              <div className="space-y-2">
                <label className="text-sm">
                  Temperature ({weather.temperature}°C)
                </label>
                <Slider
                  value={[weather.temperature]}
                  onValueChange={([value]) =>
                    setWeather((prev) => ({ ...prev, temperature: value }))
                  }
                  min={-10}
                  max={40}
                  step={1}
                />
              </div>

              <Select
                value={weather.lightLevel}
                onValueChange={(value: "bright" | "moderate" | "dim") =>
                  setWeather((prev) => ({ ...prev, lightLevel: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Light Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bright">Bright</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="dim">Dim</SelectItem>
                </SelectContent>
              </Select>

              {/* Add other weather inputs similarly */}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Shooting Scenario</h3>
            <div className="grid gap-4">
              <Select
                value={scenario.type}
                onValueChange={(value: "portrait" | "landscape") =>
                  setScenario((prev) => ({ ...prev, type: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Shooting Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="portrait">Portrait</SelectItem>
                  <SelectItem value="landscape">Landscape</SelectItem>
                </SelectContent>
              </Select>

              {/* Add other scenario inputs similarly */}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium">Film Preferences</h3>
            <div className="grid gap-4">
              <Select
                value={preferences.format}
                onValueChange={(value: "35mm" | "120" | "large-format") =>
                  setPreferences((prev) => ({ ...prev, format: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Film Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="35mm">35mm</SelectItem>
                  <SelectItem value="120">Medium Format (120)</SelectItem>
                  <SelectItem value="large-format">Large Format</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={preferences.colorPreference}
                onValueChange={(
                  value: "color" | "black-and-white" | "either"
                ) =>
                  setPreferences((prev) => ({
                    ...prev,
                    colorPreference: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Color Preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="color">Color Film</SelectItem>
                  <SelectItem value="black-and-white">Black & White</SelectItem>
                  <SelectItem value="either">No Preference</SelectItem>
                </SelectContent>
              </Select>

              <Select
                value={preferences.grainPreference}
                onValueChange={(value: "fine" | "medium" | "chunky") =>
                  setPreferences((prev) => ({
                    ...prev,
                    grainPreference: value,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Grain Preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fine">Fine Grain</SelectItem>
                  <SelectItem value="medium">Medium Grain</SelectItem>
                  <SelectItem value="chunky">Chunky Grain</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center space-x-2">
                <Switch
                  id="special-effects"
                  checked={preferences.specialEffects}
                  onCheckedChange={(checked) =>
                    setPreferences((prev) => ({
                      ...prev,
                      specialEffects: checked,
                    }))
                  }
                />
                <Label htmlFor="special-effects">
                  Suitable for Special Effects/Cross-Processing
                </Label>
              </div>
            </div>
          </div>

          <Button
            onClick={handleGetRecommendation}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? <LoadingSpinner /> : "Get Recommendation"}
          </Button>
        </CardContent>
      </Card>

      {recommendation && (
        <Card className="bg-muted">
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="font-medium">Recommended Film</h3>
              <p className="text-sm">{recommendation.recommendedFilm.name}</p>
            </div>

            {recommendation.alternativeFilm && (
              <div>
                <h3 className="font-medium">Alternative Option</h3>
                <p className="text-sm">{recommendation.alternativeFilm.name}</p>
              </div>
            )}

            <div>
              <h3 className="font-medium">Reasoning</h3>
              <p className="text-sm">{recommendation.reasoning}</p>
            </div>

            <div>
              <h3 className="font-medium">Confidence Score</h3>
              <p className="text-sm">
                {(recommendation.confidenceScore * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
