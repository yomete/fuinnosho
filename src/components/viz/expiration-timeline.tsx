"use client";

import { type Film } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { format, addDays, differenceInDays } from "date-fns";

interface ExpirationTimelineProps {
  films: Film[];
}

const getPulseIntensity = (daysUntilExpiration: number) => {
  if (daysUntilExpiration <= 30) return "animate-pulse-fast";
  if (daysUntilExpiration <= 90) return "animate-pulse-medium";
  return "animate-pulse-slow";
};

export default function ExpirationTimeline({ films }: ExpirationTimelineProps) {
  const sortedFilms = [...films].sort(
    (a, b) =>
      new Date(a.expiration_date).getTime() -
      new Date(b.expiration_date).getTime()
  );

  const now = new Date();
  const thirtyDaysFromNow = addDays(now, 30);

  const expiredFilms = sortedFilms.filter((film) => {
    const expirationDate = new Date(film.expiration_date);
    return expirationDate < now;
  });

  const expiringFilms = sortedFilms.filter((film) => {
    const expirationDate = new Date(film.expiration_date);
    return expirationDate <= thirtyDaysFromNow && expirationDate >= now;
  });

  return (
    <div className="space-y-4">
      {(expiredFilms.length > 0 || expiringFilms.length > 0) && (
        <div className="space-y-3">
          {expiredFilms.length > 0 && (
            <Alert variant="destructive" className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 mt-[1px]" />
                <AlertDescription className="mt-0 flex-1">
                  You have {expiredFilms.length} expired film(s)
                </AlertDescription>
              </div>
            </Alert>
          )}
          {expiringFilms.length > 0 && (
            <Alert className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 mt-[1px]" />
                <AlertDescription className="mt-0 flex-1">
                  You have {expiringFilms.length} film(s) expiring in the next
                  30 days
                </AlertDescription>
              </div>
            </Alert>
          )}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Expiration Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <div className="absolute left-3 h-full w-px bg-border" />
            <div className="space-y-6">
              {sortedFilms.map((film) => {
                const expirationDate = new Date(film.expiration_date);
                const daysUntilExpiration = differenceInDays(
                  expirationDate,
                  now
                );

                return (
                  <div key={film.id} className="relative pl-8">
                    <div className="absolute left-0 w-6 h-6 rounded-full bg-background border flex items-center justify-center">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          daysUntilExpiration <= 30
                            ? "bg-destructive"
                            : daysUntilExpiration <= 90
                            ? "bg-warning"
                            : "bg-primary"
                        } ${getPulseIntensity(daysUntilExpiration)}`}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {film.name}
                          <span className="text-muted-foreground ml-2">
                            ({film.brand})
                          </span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {format(expirationDate, "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge
                        variant={
                          daysUntilExpiration <= 30
                            ? "destructive"
                            : daysUntilExpiration <= 90
                            ? "default"
                            : "secondary"
                        }
                      >
                        {daysUntilExpiration} days left
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
