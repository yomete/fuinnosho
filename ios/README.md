# Fuinnosho iOS

Native SwiftUI companion app for the Fuinnosho web app.

## Setup

1. Install Xcode and XcodeGen.
2. Create the local config file and add the same public Supabase values used by the web app:

   ```bash
   cp Fuinnosho/Configuration/Secrets.example.xcconfig Fuinnosho/Configuration/Secrets.xcconfig
   ```

   `Secrets.xcconfig` is ignored by git.

   In `Secrets.xcconfig`, write the Supabase URL with the xcconfig-safe slash escape:

   ```xcconfig
   SUPABASE_URL = https:/$()/your-project.supabase.co
   SUPABASE_ANON_KEY = your-anon-key
   ```

   A plain `https://...` URL is parsed as `https:` because `//` starts a comment in xcconfig files.

3. Regenerate the project after adding or moving Swift files:

   ```bash
   xcodegen generate
   ```

   `Fuinnosho.xcodeproj` is generated from `project.yml`. Keep local Xcode
   user state and `Secrets.xcconfig` out of git.

4. Build from this directory:

   ```bash
   xcodebuild -project Fuinnosho.xcodeproj -scheme Fuinnosho -destination 'generic/platform=iOS Simulator' CODE_SIGNING_ALLOWED=NO build
   ```

   Or run the no-launch helper:

   ```bash
   ./verify.sh build
   ./verify.sh test-build
   ```

## Current Scope

- Supabase email/password auth, password reset links, email updates, password updates, and sign out
- Films list with search, native filters, stock statistics, type distribution, expiring-soon timeline, detail, create, edit, stock adjustments, deleted-film restore/permanent delete, ECN metadata, editing notes, usage history, trip reservation context, and bulk-film spooling/completion tools
- Gear list with search, type/brand/condition/price filtering, statistics, top-brand and condition breakdowns, detail, create, edit, delete, model, serial number, purchase date, and purchase price fields
- Trips list with search/filtering/statistics and web-matched derived status ordering, create/edit with native date pickers, delete, detail, sortable/filterable film reservations, film reservation quantity changes, gear packing, and completion-driven film consumption
- Detail screens refresh after edits and stock changes so web and iOS stay aligned after shared Supabase writes

The app talks directly to the same Supabase tables and views as the web app, so the database schema and RLS policies are the shared contract.

Marketing pages, public demo routes, MCP/API routes, and AI film recommendations are still web/server concerns rather than native app screens.

## MVP Verification

Run the read-only Supabase contract probe from the repo root:

```bash
MOBILE_PROBE_EMAIL=user@example.com pnpm probe:mobile
```

Run the authenticated read smoke against a real email/password account:

```bash
MOBILE_SMOKE_EMAIL=user@example.com MOBILE_SMOKE_PASSWORD='password' pnpm smoke:mobile:reads
```

For manual simulator acceptance without using a real account, create a temporary
confirmed Supabase user:

```bash
pnpm fixture:mobile:ui create
```

Use the printed credentials in the simulator, then verify and clean up from the
repo root:

```bash
MOBILE_UI_EXPECT_FILM="UI Smoke Film" pnpm fixture:mobile:ui verify
pnpm fixture:mobile:ui cleanup
```

For repeatable DEBUG simulator launch checks, pass the fixture credentials as
launch arguments:

```bash
-MobileSmokeEmail <fixture-email> -MobileSmokePassword <fixture-password>
```

These launch arguments are only consumed by DEBUG builds.

Optionally run the write smoke against the same account:

```bash
MOBILE_WRITE_SMOKE=1 MOBILE_SMOKE_EMAIL=user@example.com MOBILE_SMOKE_PASSWORD='password' pnpm smoke:mobile:writes
```

Or create a temporary auth user for the write smoke:

```bash
MOBILE_WRITE_SMOKE=1 MOBILE_SMOKE_CREATE_USER=1 pnpm smoke:mobile:writes
```

To run the repeatable no-launch mobile verification bundle:

```bash
MOBILE_PROBE_USER_ID=<auth-user-id> \
MOBILE_WRITE_SMOKE=1 \
MOBILE_SMOKE_CREATE_USER=1 \
pnpm verify:mobile
```

Without the optional env vars, `pnpm verify:mobile` still lints the mobile smoke
scripts and runs the iOS test build.

Then run the signed-in smoke checklist in [SMOKE_TEST.md](SMOKE_TEST.md) before treating the native app as done. A clean build proves the source is valid, the read probe proves the backend read shapes match the mobile queries, and the write smoke proves the RLS mutation path works. The MVP is only fully verified after the simulator app can create, update, delete, reserve, and complete records that also appear correctly in the web app.
