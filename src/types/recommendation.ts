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

export interface FilmPreferences {
  format: "35mm" | "120" | "large-format";
  colorPreference: "color" | "black-and-white" | "either";
  grainPreference: "fine" | "medium" | "chunky";
  specialEffects: boolean;
}

export interface FilmRecommendation {
  recommendedFilm: {
    name: string;
    iso: number;
    format: string;
    type: "color" | "black-and-white";
    grainCharacteristic: string;
    specialEffectsCompatible?: boolean;
  };
  alternativeFilm?: {
    name: string;
    iso: number;
    format: string;
    type: "color" | "black-and-white";
    grainCharacteristic: string;
    specialEffectsCompatible?: boolean;
  };
  reasoning: string;
  confidenceScore: number;
}
