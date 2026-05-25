#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

xcodegen generate

case "${1:-build}" in
  build)
    xcodebuild \
      -project Fuinnosho.xcodeproj \
      -scheme Fuinnosho \
      -destination 'generic/platform=iOS Simulator' \
      CODE_SIGNING_ALLOWED=NO \
      build
    ;;
  test-build)
    xcodebuild \
      -project Fuinnosho.xcodeproj \
      -scheme Fuinnosho \
      -destination 'generic/platform=iOS Simulator' \
      CODE_SIGNING_ALLOWED=NO \
      build-for-testing
    ;;
  test)
    xcodebuild \
      -project Fuinnosho.xcodeproj \
      -scheme Fuinnosho \
      -destination 'platform=iOS Simulator,name=iPhone 17 Pro' \
      CODE_SIGNING_ALLOWED=NO \
      test
    ;;
  *)
    echo "Usage: ./verify.sh [build|test-build|test]" >&2
    exit 64
    ;;
esac
