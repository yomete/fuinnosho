"use client";

import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Loader2 } from "lucide-react";

function FullScreenSpinner() {
  return (
    <div className="flex justify-center items-center h-screen">
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
        Failed to load gear. Please try again later.
      </AlertDescription>
    </Alert>
  );
}

export function GearClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary FallbackComponent={ErrorState}>
      <Suspense fallback={<FullScreenSpinner />}>{children}</Suspense>
    </ErrorBoundary>
  );
}