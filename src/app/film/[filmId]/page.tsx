import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  Film as FilmIcon,
  TrendingUp,
  MapPin,
  Eye,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getFilmWithDetails } from "@/app/actions/films";
import {
  formatDate,
  formatTripDateRange,
  getTripStatusColor,
} from "@/lib/utils";
import { format } from "date-fns";
import { FinishBulkRollButton } from "@/components/films/finish-bulk-roll-button";

interface FilmDetailPageProps {
  params: Promise<{ filmId: string }>;
}

export default async function FilmDetailPage({ params }: FilmDetailPageProps) {
  const { filmId } = await params;
  const { film, usage, trips, error } = await getFilmWithDetails(filmId);

  if (error || !film) {
    notFound();
  }

  // Calculate statistics
  const totalUsed = usage?.reduce((sum, u) => sum + u.quantity, 0) || 0;
  const totalSpooled =
    usage
      ?.filter((u) => u.usage_type === "spool")
      .reduce((sum, u) => sum + u.quantity, 0) || 0;
  const totalShot =
    usage
      ?.filter((u) => u.usage_type === "shoot")
      .reduce((sum, u) => sum + u.quantity, 0) || 0;
  const totalExposuresUsed =
    usage?.reduce((sum, u) => sum + (u.exposures_used || 0), 0) || 0;

  const isExpired = new Date(film.expiration_date) < new Date();
  const daysUntilExpiry = Math.ceil(
    (new Date(film.expiration_date).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/films" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Films
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{film.name}</h1>
          <p className="text-lg text-muted-foreground">{film.brand}</p>
        </div>
      </div>

      {/* Main Film Details */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilmIcon className="h-5 w-5" />
              Film Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Format
                </p>
                <p className="text-lg">{film.format}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ISO</p>
                <p className="text-lg">{film.iso}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Type
                </p>
                <Badge
                  variant={
                    film.type === "Black & White" ? "outline" : "default"
                  }
                >
                  {film.type}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Count
                </p>
                <p className="text-lg font-semibold">{film.count || 0}</p>
              </div>
            </div>

            <hr className="my-4" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Expiration Date
                </p>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-lg ${
                      isExpired
                        ? "text-red-600"
                        : daysUntilExpiry < 30
                        ? "text-yellow-600"
                        : ""
                    }`}
                  >
                    {formatDate(film.expiration_date)}
                  </p>
                  {isExpired && <Badge variant="destructive">Expired</Badge>}
                  {!isExpired && daysUntilExpiry < 30 && (
                    <Badge variant="outline">Expires soon</Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Price
                </p>
                <p className="text-lg">
                  {film.price ? `$${film.price}` : "Not specified"}
                </p>
              </div>
            </div>

            {film.is_bulk_film && (
              <>
                <hr className="my-4" />
                <div className="space-y-2">
                  <h4 className="font-medium">Bulk Film Details</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Length</p>
                      <p>{film.bulk_length_meters}m</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Calculated Rolls</p>
                      <p>{film.calculated_rolls}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">
                        Remaining Exposures
                      </p>
                      <p>{film.bulk_remaining_exposures}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Spooled Cassettes</p>
                      <p>{film.spooled_cassettes}</p>
                    </div>
                  </div>
                  {film.bulk_quantity && film.bulk_quantity > 1 && (
                    <div className="mt-4 p-3 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">Bulk Rolls Progress</p>
                          <p className="text-sm text-muted-foreground">
                            Roll {(film.bulk_rolls_used || 0) + 1} of {film.bulk_quantity}
                            {film.bulk_rolls_used ? ` (${film.bulk_rolls_used} completed)` : ''}
                          </p>
                        </div>
                        <FinishBulkRollButton
                          filmId={film.id}
                          currentRoll={(film.bulk_rolls_used || 0) + 1}
                          totalRolls={film.bulk_quantity}
                          bulkRollsUsed={film.bulk_rolls_used || 0}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}

            {film.is_ecn && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">ECN Film</Badge>
                <span className="text-sm text-muted-foreground">
                  Requires ECN processing
                </span>
              </div>
            )}

            {film.notes && (
              <>
                <hr className="my-4" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Notes
                  </p>
                  <p className="text-sm">{film.notes}</p>
                </div>
              </>
            )}

            {film.editing_notes && (
              <>
                <hr className="my-4" />
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-2">
                    Editing Notes
                  </p>
                  <p className="text-sm">{film.editing_notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Usage Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Total Used</p>
                <p className="text-2xl font-bold">{totalUsed}</p>
              </div>
              {film.is_bulk_film && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Spooled</p>
                    <p className="text-xl font-semibold">{totalSpooled}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Shot</p>
                    <p className="text-xl font-semibold">{totalShot}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Exposures Used
                    </p>
                    <p className="text-xl font-semibold">
                      {totalExposuresUsed}
                    </p>
                  </div>
                </>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Usage Events</p>
                <p className="text-xl font-semibold">{usage?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trip Reservations */}
      {trips && trips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Trip Reservations ({trips.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trips.map((tripFilm, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/trips/${tripFilm.trips?.id}`}
                        className="font-medium hover:underline"
                      >
                        {tripFilm.trips?.title}
                      </Link>
                      <Badge
                        variant="outline"
                        className={getTripStatusColor(tripFilm.trips?.status || 'upcoming')}
                      >
                        {tripFilm.trips?.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {tripFilm.trips && formatTripDateRange(
                        tripFilm.trips.start_date,
                        tripFilm.trips.end_date
                      )}
                    </p>
                    {tripFilm.trips?.description && (
                      <p className="text-sm text-muted-foreground">
                        {tripFilm.trips.description}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{tripFilm.quantity} rolls</p>
                    <p className="text-sm text-muted-foreground">reserved</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage History */}
      {usage && usage.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Usage History ({usage.length} events)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {usage.map((usageEvent) => (
                <div
                  key={usageEvent.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          usageEvent.usage_type === "spool"
                            ? "secondary"
                            : "default"
                        }
                      >
                        {usageEvent.usage_type === "spool" ? "Spooled" : "Shot"}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {format(
                          new Date(usageEvent.created_at),
                          "MMM dd, yyyy HH:mm"
                        )}
                      </span>
                    </div>
                    {usageEvent.usage_note && (
                      <p className="text-sm">{usageEvent.usage_note}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{usageEvent.quantity}</p>
                    {usageEvent.exposures_used && (
                      <p className="text-sm text-muted-foreground">
                        {usageEvent.exposures_used} exposures
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Empty states */}
      {(!trips || trips.length === 0) && (!usage || usage.length === 0) && (
        <Card>
          <CardContent className="text-center py-8">
            <Eye className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Activity Yet</h3>
            <p className="text-muted-foreground">
              This film hasn&apos;t been used or reserved for any trips yet.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
