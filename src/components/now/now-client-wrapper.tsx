"use client";

import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

function FullScreenSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Loader2 className="h-4 w-4 animate-spin" />
    </div>
  );
}

function ErrorState() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Failed to load what’s in your cameras. Please try again later.
      </AlertDescription>
    </Alert>
  );
}

export function NowClientWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorState}>
      <Suspense fallback={<FullScreenSpinner />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
