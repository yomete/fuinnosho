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
                onValueChange={(value: any) =>
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
                onValueChange={(value: any) =>
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
