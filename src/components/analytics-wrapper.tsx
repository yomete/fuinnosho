"use client";

import dynamic from "next/dynamic";

// Defer analytics loading until after hydration (bundle-defer-third-party)
// This reduces initial bundle size and improves Time to Interactive
const Analytics = dynamic(
  () => import("@vercel/analytics/react").then((mod) => mod.Analytics),
  { ssr: false }
);

export function AnalyticsWrapper() {
  return <Analytics />;
}
