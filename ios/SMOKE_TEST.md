# Fuinnosho iOS Smoke Test

Use this checklist before calling the native MVP done. The app must be signed in with a real Supabase user, and the web app should show the same records after each write.

## Build

```bash
cd ios
xcodegen generate
xcodebuild -project Fuinnosho.xcodeproj -scheme Fuinnosho -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
```

From the repo root, the repeatable no-launch verification bundle is:

```bash
MOBILE_PROBE_USER_ID=<auth-user-id> \
MOBILE_WRITE_SMOKE=1 \
MOBILE_SMOKE_CREATE_USER=1 \
pnpm verify:mobile
```

## Read-only Supabase Contract Probe

From the repo root, run this before launching the app:

```bash
MOBILE_PROBE_EMAIL=user@example.com pnpm probe:mobile
```

Or use the auth user id:

```bash
MOBILE_PROBE_USER_ID=<auth-user-id> pnpm probe:mobile
```

The probe does not write data. It checks the same Supabase read shapes used by
the mobile Films, Gear, and Trips tabs with service-role access.

## Authenticated Read Smoke

From the repo root, run this to verify the same public anon-key email/password
session model the iOS app uses:

```bash
MOBILE_SMOKE_EMAIL=user@example.com \
MOBILE_SMOKE_PASSWORD='password' \
pnpm smoke:mobile:reads
```

The read smoke does not write data. It signs in as the user and checks that
Films, Gear, and Trips are readable through RLS before the simulator is opened.

## Temporary Simulator UI Fixture

When you do not want to use a real account for manual simulator testing, create
a temporary confirmed Supabase auth user:

```bash
pnpm fixture:mobile:ui create
```

Sign into the simulator with the printed email/password, perform the UI actions,
then verify rows the simulator created:

```bash
MOBILE_UI_EXPECT_FILM="UI Smoke Film" \
MOBILE_UI_EXPECT_GEAR="UI Smoke Gear" \
MOBILE_UI_EXPECT_TRIP="UI Smoke Trip" \
pnpm fixture:mobile:ui verify
```

Unset any expected row env vars for entities you did not create. Always clean up
the temporary user and owned rows afterward:

```bash
pnpm fixture:mobile:ui cleanup
```

## Opt-in Write Smoke

From the repo root, run this only when you want to mutate Supabase with a
temporary smoke film, gear item, and trip:

```bash
MOBILE_WRITE_SMOKE=1 \
MOBILE_SMOKE_EMAIL=user@example.com \
MOBILE_SMOKE_PASSWORD='password' \
pnpm smoke:mobile:writes
```

The write smoke script signs in with the public Supabase client, creates temporary
records, exercises edit/reserve/remove/complete/soft-delete behavior, and then
deletes the rows it created. It fails if cleanup leaves smoke rows behind. It
is a backend/RLS smoke test; still run the manual simulator checklist below
before calling the native MVP done.

When you do not want to use a real account password, create a temporary auth
user for the smoke run instead:

```bash
MOBILE_WRITE_SMOKE=1 \
MOBILE_SMOKE_CREATE_USER=1 \
pnpm smoke:mobile:writes
```

This mode requires `SUPABASE_SERVICE_ROLE_KEY`, signs in through the public anon
client after creating the user, and deletes the temporary auth user at the end.

## Auth

- Launch `Fuinnosho` on the simulator.
- Sign in with an existing Supabase email/password account.
- Confirm the app opens to the Films tab without a Films/Gear/Trips auth alert.
- Tap Sign Out.
- Confirm the app returns to the sign-in screen.
- Sign in again before continuing.

## Films

- Create a film named `iOS Smoke Film`.
- Confirm it appears in the Films list.
- Open the film detail and edit the notes or editing notes.
- Add one roll from Adjust Stock.
- Mark one roll shot from Adjust Stock.
- Soft-delete the film from the Films list.
- Confirm the web app reflects the create/edit/stock/delete changes.

Shared Supabase surface:

- `films`
- `films_with_availability`
- `film_usage`

## Gear

- Create gear named `iOS Smoke Gear`.
- Confirm it appears in the Gear list.
- Open the gear detail and edit the notes.
- Delete the gear.
- Confirm the web app reflects the create/edit/delete changes.

Shared Supabase surface:

- `gear`
- `trip_gear`

## Trips

- Create a trip named `iOS Smoke Trip`.
- Confirm it appears in the Trips list with derived status ordering.
- Open the trip detail.
- Reserve available film.
- Edit the reserved film quantity.
- Pack available gear.
- Remove the reserved film.
- Remove packed gear.
- Reserve film again.
- Complete the trip.
- Confirm the reserved film count is consumed and a `film_usage` row appears in the web app.
- Delete the trip.
- Confirm the web app reflects the trip and reservation changes.

Shared Supabase surface:

- `trips`
- `trip_films`
- `trip_gear`
- `film_usage`

## Pass Criteria

- The native app builds cleanly.
- Auth transitions never leave the user in a tab with `Sign in before continuing`.
- All create/edit/delete/reserve/complete actions succeed for a real user.
- The web app and iOS app show the same data after refresh.
