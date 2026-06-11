#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

pnpm exec eslint \
  scripts/probe-mobile-contract.ts \
  scripts/mobile-ui-fixture.ts \
  scripts/smoke-mobile-reads.ts \
  scripts/smoke-mobile-writes.ts

if [[ -n "${MOBILE_PROBE_USER_ID:-}" || -n "${MOBILE_PROBE_EMAIL:-}" ]]; then
  pnpm probe:mobile
else
  echo "Skipping probe:mobile; set MOBILE_PROBE_USER_ID or MOBILE_PROBE_EMAIL to run it."
fi

if [[ "${MOBILE_WRITE_SMOKE:-}" == "1" ]]; then
  pnpm smoke:mobile:writes
else
  echo "Skipping smoke:mobile:writes; set MOBILE_WRITE_SMOKE=1 to run it."
fi

(
  cd ios
  ./verify.sh test-build
)
