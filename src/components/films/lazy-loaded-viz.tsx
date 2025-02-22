import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Film } from "@/lib/utils";

interface LazyLoadedVizProps {
  component: React.ComponentType<{ films: Film[] }>;
  films: Film[];
}

export function LazyLoadedViz({
  component: Component,
  films,
}: LazyLoadedVizProps) {
  return (
    <Suspense
      fallback={
        <div className="w-full h-[300px] rounded-lg">
          <Skeleton className="w-full h-full" />
        </div>
      }
    >
      <Component films={films} />
    </Suspense>
  );
}
