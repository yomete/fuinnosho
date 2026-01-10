# Known Bugs

Issues discovered through automated testing (2026-01-10).

---

## Bug #1: Trip Film Consumption Uses Fragile String Matching

**Severity:** Medium
**File:** [src/app/actions/trips.ts:754](src/app/actions/trips.ts#L754)

### Description

The `consumeTripFilms()` function prevents double-consumption by checking if films have already been consumed using a `LIKE` query on the `usage_note` field:

```typescript
.like("usage_note", `%Trip: ${trip.title}%`)
```

### Problems

1. **Trip rename breaks the check** - If a trip title is changed after films are consumed, the string match fails and films could be consumed again
2. **Partial match false positives** - "Trip: Japan" would incorrectly match "Trip: Japan 2024"
3. **SQL special characters** - Trip titles containing `%` or `_` could cause unexpected behavior

### Recommended Fix

Add a `trip_id` column to the `film_usage` table and use that for the check instead of string matching:

```typescript
// Instead of:
.like("usage_note", `%Trip: ${trip.title}%`)

// Use:
.eq("trip_id", tripId)
```

This requires a database migration to add the `trip_id` foreign key to `film_usage`.

---

## Bug #2: Bulk Film Exposure Calculation Ignores Non-Standard Formats

**Severity:** Low
**File:** [src/app/actions/films.ts:104](src/app/actions/films.ts#L104)

### Description

When creating a bulk film, the initial exposure count is calculated with a hardcoded assumption:

```typescript
Number(validatedData.calculated_rolls || 0) * (validatedData.format === '120' ? 12 : 36)
```

### Problems

1. Only handles `120` (12 exposures) and assumes everything else is `35mm` (36 exposures)
2. Formats like `4x5`, `8x10`, `645`, `6x7` get incorrectly assigned 36 exposures
3. Large format films typically have 1 exposure per sheet, not 36

### Recommended Fix

Create a format-to-exposures mapping:

```typescript
const EXPOSURES_PER_FORMAT: Record<string, number> = {
  '35mm': 36,
  '120': 12,
  '220': 24,
  '4x5': 1,
  '8x10': 1,
  '645': 15,  // or 16 depending on camera
  '6x7': 10,
  '6x9': 8,
};

const exposuresPerRoll = EXPOSURES_PER_FORMAT[validatedData.format] ?? 36;
```

Or add a field in the form to let users specify exposures per roll for bulk films.

---

## Testing Coverage

These bugs were identified while writing 559 unit/integration tests covering:

- `src/lib/prediction-utils.ts` (81 tests)
- `src/lib/utils.ts` (138 tests)
- `src/components/table/filter-reducer.ts` (74 tests)
- `src/lib/usage-utils.ts` (53 tests)
- `src/lib/film-grouping.ts` (47 tests)
- `src/app/actions/films.ts` (75 tests)
- `src/app/actions/trips.ts` (48 tests)
- `src/app/actions/gear.ts` (43 tests)

Run tests with: `pnpm test`

---

## Missing Feature #1: No UI to Restore Deleted Films

**Severity:** Low
**Discovered:** E2E test writing ([e2e/film-lifecycle.spec.ts:384](e2e/film-lifecycle.spec.ts#L384))

### Description

Films are soft-deleted (setting `deleted_at` timestamp) but there's no UI for users to view or restore deleted films. The backend actions exist but are inaccessible:

- `getDeletedFilms()` - Returns soft-deleted films
- `restoreFilm()` - Clears `deleted_at` to restore a film

### Impact

Users who accidentally delete a film have no way to recover it through the UI. The data is preserved in the database but invisible.

### Recommended Fix

Add a "Trash" or "Deleted Films" view accessible from the films page:

1. Add a "View Deleted" button/tab on the films page
2. Show deleted films with restore/permanent delete options
3. Consider auto-purging deleted films after X days

---

## Missing Feature #2: 120 Format Bulk Film Support

**Severity:** Low
**Discovered:** E2E test writing ([e2e/film-lifecycle.spec.ts:621](e2e/film-lifecycle.spec.ts#L621))

### Description

The bulk film toggle only appears for 35mm format, but 120 bulk film exists in the real world (e.g., Ilford HP5+ 30.5m rolls).

### Current Behavior

Selecting 120 format hides the "Bulk Film" toggle, preventing users from tracking 120 bulk film inventory.

### Recommended Fix

Enable bulk film option for 120 format as well. The exposure calculation already handles 120 (12 exposures per roll vs 36 for 35mm)
