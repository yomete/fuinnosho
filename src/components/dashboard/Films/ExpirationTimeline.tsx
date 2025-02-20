"use client";

import { Film } from "./utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface ExpirationTimelineProps {
  films: Film[];
}

export default function ExpirationTimeline({ films }: ExpirationTimelineProps) {
  const sortedFilms = [...films].sort(
    (a, b) =>
      new Date(a.expiration_date).getTime() -
      new Date(b.expiration_date).getTime()
  );

  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const expiringFilms = sortedFilms.filter(
    (film) =>
      new Date(film.expiration_date) <= thirtyDaysFromNow &&
      new Date(film.expiration_date) >= now
  );

  return (
    <div className="p-4 space-y-4">
      {expiringFilms.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You have {expiringFilms.length} film(s) expiring in the next 30 days
          </AlertDescription>
        </Alert>
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
                const daysUntilExpiration = Math.ceil(
                  (expirationDate.getTime() - now.getTime()) /
                    (1000 * 60 * 60 * 24)
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
                        }`}
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
                          Expires: {expirationDate.toLocaleDateString()}
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
