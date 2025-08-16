"use client";

import { UsageAnalytics } from "@/components/usage/usage-analytics";

export default function UsagePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Usage Analytics</h1>
        <p className="text-muted-foreground">
          Track your film consumption, shooting patterns, and lab development costs
        </p>
      </div>
      
      <UsageAnalytics />
    </div>
  );
}