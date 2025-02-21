"use server";

import OpenAI from "openai";
import {
  WeatherConditions,
  ShootingScenario,
  FilmRecommendation,
} from "@/types/recommendation";
import { getFilms } from "@/app/actions/films";
import { getFilmById } from "@/app/actions/films";
import { Film } from "@/components/dashboard/films/utils";
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getFilmRecommendation(
  weather: WeatherConditions,
  scenario: ShootingScenario
): Promise<FilmRecommendation> {
  try {
    // Get all films from Supabase
    const { data: availableFilms, error: filmsError } = await getFilms();

    if (filmsError) throw new Error("Failed to fetch films");
    if (!availableFilms?.length) throw new Error("No films available");

    const prompt = `
      As a professional photographer, recommend the best film stock for the following conditions:
      
      Weather:
      - Temperature: ${weather.temperature}°C
      - Light: ${weather.lightLevel}
      - Time: ${weather.timeOfDay}
      - Overcast: ${weather.isOvercast}
      
      Shooting Scenario:
      - Type: ${scenario.type}
      - Environment: ${scenario.environment}
      - Movement: ${scenario.movement}
      
      Available films: ${JSON.stringify(availableFilms)}
      
      Provide recommendation in JSON format with:
      - recommendedFilmId (string)
      - alternativeFilmId (string, optional)
      - reasoning (string)
      - confidenceScore (number between 0-1)
    `;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4-turbo-preview",
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(completion.choices[0].message.content!);

    // Get recommended film from Supabase
    const recommendedFilm = await getFilmById(result.recommendedFilmId);

    if (!recommendedFilm) throw new Error("Recommended film not found");

    // Get alternative film if provided
    let alternativeFilm = undefined;
    if (result.alternativeFilmId) {
      const altFilm = await getFilmById(result.alternativeFilmId);

      alternativeFilm = altFilm;
    }

    return {
      recommendedFilm,
      alternativeFilm: alternativeFilm as Film | undefined,
      reasoning: result.reasoning,
      confidenceScore: result.confidenceScore,
    };
  } catch (error) {
    console.error("Film recommendation error:", error);
    throw new Error("Failed to get film recommendation");
  }
}
