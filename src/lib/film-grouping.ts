import { Film } from "./utils";

/**
 * Represents a group of films that share the same identifying properties
 */
export interface FilmGroup {
  id: string;
  groupKey: string;
  isGroup: true; // Type discriminator
  isExpanded: boolean;
  films: Film[]; // Child films in this group

  // Core identifying fields
  name: string;
  brand: string;
  iso: number;
  format: string;
  type: string;
  is_ecn?: boolean;

  // Aggregated fields
  total_count: number;
  total_available: number;
  total_reserved: number;
  earliest_expiration: string;

  // Compatibility mappings for table columns
  count: number; // Maps to total_count
  available_count: number; // Maps to total_available
  reserved_quantity: number; // Maps to total_reserved
  expiration_date: string; // Maps to earliest_expiration

  // Metadata
  created_at: string; // From earliest film
  updated_at: string; // From latest film
  user_id?: string;
}

/**
 * Union type for table rows (either individual film or grouped films)
 */
export type TableRow = Film | FilmGroup;

/**
 * Type guard to check if a row is a FilmGroup
 */
export function isFilmGroup(row: TableRow): row is FilmGroup {
  return "isGroup" in row && row.isGroup === true;
}

/**
 * Creates a unique grouping key from a film's identifying properties
 */
export function createGroupKey(film: Film): string {
  return `${film.name}|${film.brand}|${film.format}|${film.iso}|${film.type}`;
}

/**
 * Groups films by their identifying properties (name, brand, format, iso, type)
 * Returns an array of TableRow objects (Film or FilmGroup)
 */
export function groupFilms(
  films: Film[],
  options: { enableGrouping?: boolean } = { enableGrouping: true }
): TableRow[] {
  // If grouping is disabled, return films as-is
  if (!options.enableGrouping) {
    return films;
  }

  // Group films by their composite key
  const groupMap = new Map<string, Film[]>();

  films.forEach((film) => {
    const key = createGroupKey(film);
    const existing = groupMap.get(key);
    if (existing) {
      existing.push(film);
    } else {
      groupMap.set(key, [film]);
    }
  });

  // Convert groups to TableRow objects
  const result: TableRow[] = [];

  groupMap.forEach((groupedFilms, groupKey) => {
    // If only one film in group, add it as-is
    if (groupedFilms.length === 1) {
      result.push(groupedFilms[0]);
      return;
    }

    // Multiple films - create a FilmGroup
    const firstFilm = groupedFilms[0];

    // Calculate aggregated values
    const totalCount = groupedFilms.reduce(
      (sum, film) => sum + (film.count || 0),
      0
    );

    const totalAvailable = groupedFilms.reduce(
      (sum, film) =>
        sum +
        (typeof film.available_count === "number"
          ? film.available_count
          : film.count || 0),
      0
    );

    const totalReserved = groupedFilms.reduce(
      (sum, film) => sum + (film.reserved_quantity || 0),
      0
    );

    // Find earliest expiration date
    const earliestExpiration = groupedFilms.reduce((earliest, film) => {
      if (!earliest) return film.expiration_date;
      return new Date(film.expiration_date) < new Date(earliest)
        ? film.expiration_date
        : earliest;
    }, groupedFilms[0].expiration_date);

    // Find earliest created_at
    const earliestCreated = groupedFilms.reduce((earliest, film) => {
      if (!earliest) return film.created_at;
      return new Date(film.created_at) < new Date(earliest)
        ? film.created_at
        : earliest;
    }, groupedFilms[0].created_at);

    // Find latest updated_at
    const latestUpdated = groupedFilms.reduce((latest, film) => {
      if (!latest) return film.updated_at;
      return new Date(film.updated_at) > new Date(latest)
        ? film.updated_at
        : latest;
    }, groupedFilms[0].updated_at);

    const filmGroup: FilmGroup = {
      id: `group-${groupKey}`,
      groupKey,
      isGroup: true,
      isExpanded: false,
      films: groupedFilms,

      // Core fields from first film
      name: firstFilm.name,
      brand: firstFilm.brand,
      iso: firstFilm.iso,
      format: firstFilm.format,
      type: firstFilm.type,
      is_ecn: firstFilm.is_ecn,

      // Aggregated values
      total_count: totalCount,
      total_available: totalAvailable,
      total_reserved: totalReserved,
      earliest_expiration: earliestExpiration,

      // Compatibility mappings
      count: totalCount,
      available_count: totalAvailable,
      reserved_quantity: totalReserved,
      expiration_date: earliestExpiration,

      // Metadata
      created_at: earliestCreated,
      updated_at: latestUpdated,
      user_id: firstFilm.user_id,
    };

    result.push(filmGroup);
  });

  return result;
}

/**
 * Expands a FilmGroup into individual film rows for display
 */
export function expandGroup(group: FilmGroup): TableRow[] {
  return [group, ...group.films];
}

/**
 * Converts a list of TableRows with expansion state applied
 */
export function applyExpansionState(
  rows: TableRow[],
  expansionState: Map<string, boolean>
): TableRow[] {
  const result: TableRow[] = [];

  rows.forEach((row) => {
    if (isFilmGroup(row)) {
      const isExpanded = expansionState.get(row.groupKey) || false;
      const expandedGroup = { ...row, isExpanded };
      result.push(expandedGroup);

      if (isExpanded) {
        // Add child films
        result.push(...row.films);
      }
    } else {
      result.push(row);
    }
  });

  return result;
}
