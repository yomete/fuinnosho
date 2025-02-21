"use client";

import { ErrorBoundary } from "react-error-boundary";
import { Suspense } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Loading component for Suspense fallback
function LoadingState() {
  return (
    <div className="space-y-8">
      <Skeleton className="h-[400px] w-full" />
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-[200px] w-full" />
    </div>
  );
}

// Make this a client component
function ErrorState() {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Failed to load films. Please try again later.
      </AlertDescription>
    </Alert>
  );
}

export function FilmsClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ErrorBoundary FallbackComponent={ErrorState}>
      <Suspense fallback={<LoadingState />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
