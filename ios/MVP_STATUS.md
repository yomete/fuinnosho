# Fuinnosho iOS MVP Status

## Implemented

- Supabase email/password sign-in, sign-out, password reset email, native reset-link handling, email updates, and password updates.
- Films list with search/filtering/statistics, type distribution, expiring-soon timeline, detail, create, edit, stock add/shot adjustments, deleted-film restore/permanent delete, usage history, trip reservation context, bulk spooling, and bulk roll completion.
- Gear list with search, type/brand/condition/price filtering, statistics, top-brand and condition breakdowns, detail, create, edit, delete, and lens-to-camera selection.
- Trips list with search/filtering/statistics, detail, create, edit, delete, sortable/filterable film reservations, film reservation quantity changes, gear packing, gear/film removal, and completion-driven film consumption.
- Shared direct Supabase access for the same tables/views used by the web app.
- DEBUG-only list footers showing signed-in email and loaded row counts for Films, Gear, and Trips.

## Verified

Run from the repo root:

```bash
MOBILE_PROBE_USER_ID=<auth-user-id> \
MOBILE_WRITE_SMOKE=1 \
MOBILE_SMOKE_CREATE_USER=1 \
pnpm verify:mobile
```

Current verified gates:

- Mobile smoke script lint passes.
- Real-account read contract passes for `films_with_availability`, `gear`, `trips`, `trip_films`, `trip_gear`, and `film_usage`.
- Temporary auth-user write smoke signs in through the public Supabase anon client, exercises RLS-backed create/edit/reserve/remove/complete/delete behavior, and fails if cleanup leaves smoke rows behind.
- iOS no-launch `build-for-testing` passes.
- Signed-in simulator read pass with a temporary Supabase auth user shows Films, Gear, and Trips list rows in the native UI.
- Signed-in simulator create pass with a temporary Supabase auth user creates a Film from the native UI, confirms the row in Supabase, and cleans up the row/user.
- `pnpm fixture:mobile:ui` can create, verify, and clean temporary simulator acceptance accounts.
- DEBUG simulator launch args can sign in a temporary fixture account for repeatable automated read acceptance without manual typing.
- Current simulator unit suite passes with 15 tests.

## Intentional Non-Parity

- Marketing pages and public demo routes remain web-only.
- MCP/API routes remain server-side repo features, not native app screens.
- AI film recommendations remain web-only until the app has a native recommendation design and a server-mediated API path.

## Remaining User Acceptance

The final user-owned acceptance gate is a signed-in simulator pass with the real account:

- Films tab shows the expected count and list rows.
- Gear tab shows the expected count and list rows.
- Trips tab shows the expected count and list rows.
- A create/edit/delete/reserve/complete flow in the simulator appears correctly after refreshing the web app.

The DEBUG list footer should make failures concrete:

- `0 loaded` means account/session/query data needs inspection.
- A non-zero count with an empty list means a SwiftUI rendering/layout issue.
- A tab-specific alert means the listed Supabase query or decoder path failed.
