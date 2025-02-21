import { Film } from "@/components/dashboard/Films/utils";

export interface WeatherConditions {
  temperature: number;
  isOvercast: boolean;
  lightLevel: "bright" | "moderate" | "dim";
  timeOfDay: "morning" | "afternoon" | "evening";
}

export interface ShootingScenario {
  type: "portrait" | "landscape";
  environment: "indoor" | "outdoor";
  movement: "static" | "dynamic";
}

export interface FilmRecommendation {
  recommendedFilm: Film;
  alternativeFilm?: Film;
  reasoning: string;
  confidenceScore: number;
}
