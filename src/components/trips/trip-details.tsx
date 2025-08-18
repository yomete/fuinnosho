"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Trip,
  Gear,
  getGearTypeIcon,
  formatTripDateRange,
  formatTripDuration,
} from "@/lib/utils";
import {
  getTripWithFilms,
  addFilmToTrip,
  removeFilmFromTrip,
  updateFilmQuantityInTrip,
  deleteTrip,
  getFilmsWithAvailability,
  getTripWithGear,
  addGearToTrip,
  removeGearFromTrip,
  getAvailableGear,
} from "@/app/actions/trips";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Plus,
  Trash2,
  X,
  Edit,
  Filter,
  SortAsc,
  SortDesc,
  BookOpen,
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/spinner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ShotLogger } from "@/components/shots/shot-logger";

interface TripDetailsProps {
  trip: Trip;
  onBack?: () => void;
}

interface FilmWithReservedQuantity {
  id: string;
  name: string;
  brand: string;
  iso: number;
  format: string;
  type: string;
  reserved_quantity: number;
}

interface FilmWithAvailability {
  id: string;
  name: string;
  brand: string;
  iso: number;
  format: string;
  type: string;
  expiration_date: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  price?: number;
  notes?: string;
  count?: number;
  total_count: number;
  reserved_quantity: number;
  available_count: number;
}

interface GearForTrip {
  id: string;
  name: string;
  brand: string;
  type: string;
  model?: string;
}

export function TripDetails({ trip, onBack }: TripDetailsProps) {
  const router = useRouter();
  const [tripFilms, setTripFilms] = useState<FilmWithReservedQuantity[]>([]);
  const [availableFilms, setAvailableFilms] = useState<FilmWithAvailability[]>(
    []
  );
  const [tripGear, setTripGear] = useState<GearForTrip[]>([]);
  const [availableGear, setAvailableGear] = useState<Gear[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilmId, setSelectedFilmId] = useState<string>("");
  const [selectedGearId, setSelectedGearId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddingFilm, setIsAddingFilm] = useState(false);
  const [isAddingGear, setIsAddingGear] = useState(false);
  const [editingFilmId, setEditingFilmId] = useState<string | null>(null);
  const [editQuantity, setEditQuantity] = useState<number>(1);
  const [sortBy, setSortBy] = useState<"name" | "iso" | "brand" | "quantity">(
    "iso"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [isoFilter, setIsoFilter] = useState<string>("all");

  const loadTripData = useCallback(async () => {
    const [filmsResult, gearResult] = await Promise.all([
      getTripWithFilms(trip.id),
      getTripWithGear(trip.id),
    ]);

    if (filmsResult.films) {
      setTripFilms(filmsResult.films);
    }

    if (gearResult.gear) {
      setTripGear(gearResult.gear);
    }

    setIsLoading(false);
  }, [trip.id]);

  const loadAvailableFilms = useCallback(async () => {
    const result = await getFilmsWithAvailability();
    if (result.data) {
      setAvailableFilms(result.data.filter((film) => film.available_count > 0));
    }
  }, []);

  const loadAvailableGear = useCallback(async () => {
    const result = await getAvailableGear();
    if (result.data) {
      // Filter out gear that's already reserved for this trip
      const filteredGear = result.data.filter(
        (gear) => !tripGear.some((reserved) => reserved.id === gear.id)
      );
      setAvailableGear(filteredGear);
    }
  }, [tripGear]);

  useEffect(() => {
    loadTripData();
    loadAvailableFilms();
  }, [loadTripData, loadAvailableFilms]);

  useEffect(() => {
    loadAvailableGear();
  }, [loadAvailableGear]);

  const handleAddFilm = async () => {
    if (!selectedFilmId || quantity < 1) return;

    const selectedFilm = availableFilms.find((f) => f.id === selectedFilmId);
    if (!selectedFilm || quantity > selectedFilm.available_count) {
      alert(
        `Cannot add ${quantity} films. Only ${
          selectedFilm?.available_count || 0
        } available.`
      );
      return;
    }

    setIsAddingFilm(true);
    const result = await addFilmToTrip(trip.id, selectedFilmId, quantity);

    if (result.success) {
      setSelectedFilmId("");
      setQuantity(1);
      loadTripData();
      loadAvailableFilms();
      router.refresh();
    }
    setIsAddingFilm(false);
  };

  const handleRemoveFilm = async (filmId: string) => {
    const result = await removeFilmFromTrip(trip.id, filmId);

    if (result.success) {
      loadTripData();
      loadAvailableFilms();
      router.refresh();
    }
  };

  const handleEditQuantity = (filmId: string, currentQuantity: number) => {
    setEditingFilmId(filmId);
    setEditQuantity(currentQuantity);
  };

  const handleSaveQuantity = async (filmId: string) => {
    if (editQuantity < 1) {
      alert("Quantity must be at least 1");
      return;
    }

    const result = await updateFilmQuantityInTrip(
      trip.id,
      filmId,
      editQuantity
    );

    if (result.success) {
      setEditingFilmId(null);
      loadTripData();
      loadAvailableFilms();
      router.refresh();
    } else {
      alert(result.error || "Failed to update quantity");
    }
  };

  const handleCancelEdit = () => {
    setEditingFilmId(null);
    setEditQuantity(1);
  };

  const getFilteredAndSortedFilms = () => {
    let filtered = tripFilms;

    // Apply ISO filter
    if (isoFilter && isoFilter !== "all") {
      const filterValue = parseInt(isoFilter);
      if (!isNaN(filterValue)) {
        filtered = filtered.filter((film) => film.iso === filterValue);
      }
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      let aValue, bValue;

      switch (sortBy) {
        case "name":
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case "iso":
          aValue = a.iso;
          bValue = b.iso;
          break;
        case "brand":
          aValue = a.brand.toLowerCase();
          bValue = b.brand.toLowerCase();
          break;
        case "quantity":
          aValue = a.reserved_quantity;
          bValue = b.reserved_quantity;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return sorted;
  };

  const toggleSort = (newSortBy: typeof sortBy) => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(newSortBy);
      setSortOrder("asc");
    }
  };

  const getUniqueISOs = () => {
    const isos = tripFilms.map((film) => film.iso);
    return [...new Set(isos)].sort((a, b) => a - b);
  };

  const handleAddGear = async () => {
    if (!selectedGearId) return;

    setIsAddingGear(true);
    const result = await addGearToTrip(trip.id, selectedGearId);

    if (result.success) {
      setSelectedGearId("");
      loadTripData();
      router.refresh();
    }
    setIsAddingGear(false);
  };

  const handleRemoveGear = async (gearId: string) => {
    const result = await removeGearFromTrip(trip.id, gearId);

    if (result.success) {
      loadTripData();
      router.refresh();
    }
  };

  const handleDeleteTrip = async () => {
    if (
      confirm(
        "Are you sure you want to delete this trip? This action cannot be undone."
      )
    ) {
      const result = await deleteTrip(trip.id);

      if (result.success) {
        if (onBack) {
          router.refresh();
          onBack();
        } else {
          router.push("/trips");
          router.refresh();
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <LoadingSpinner message="Loading trip details..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          {onBack ? (
            <Button variant="ghost" onClick={onBack} className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trips
            </Button>
          ) : (
            <Link href="/trips">
              <Button variant="ghost" className="mb-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Trips
              </Button>
            </Link>
          )}

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{trip.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatTripDateRange(trip.start_date, trip.end_date)}
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-1" />
                  {formatTripDuration(trip.start_date, trip.end_date)}
                </div>
              </div>
            </div>

            <Button variant="destructive" size="sm" onClick={handleDeleteTrip}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Trip
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{trip.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <CardTitle>Reserved Films</CardTitle>
                  <CardDescription>
                    Films you&apos;ve reserved for this trip
                    {tripFilms.length > 0 && (
                      <span className="ml-2 font-medium text-foreground">
                        {isoFilter !== "all" &&
                        getFilteredAndSortedFilms().length !==
                          tripFilms.length ? (
                          <>
                            (
                            {getFilteredAndSortedFilms().reduce(
                              (total, film) => total + film.reserved_quantity,
                              0
                            )}{" "}
                            of{" "}
                            {tripFilms.reduce(
                              (total, film) => total + film.reserved_quantity,
                              0
                            )}{" "}
                            total)
                          </>
                        ) : (
                          <>
                            (
                            {tripFilms.reduce(
                              (total, film) => total + film.reserved_quantity,
                              0
                            )}{" "}
                            total)
                          </>
                        )}
                      </span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedFilmId}
                    onValueChange={setSelectedFilmId}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select a film" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableFilms.map((film) => (
                        <SelectItem key={film.id} value={film.id}>
                          {film.name} ({film.available_count} available)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-1">
                    <Input
                      type="number"
                      min="1"
                      max={
                        selectedFilmId
                          ? availableFilms.find(
                              (f) => f.id === selectedFilmId
                            )?.available_count || 1
                          : 1
                      }
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(
                          Math.max(1, parseInt(e.target.value) || 1)
                        )
                      }
                      className="w-16"
                      placeholder="Qty"
                    />
                  </div>
                  <Button
                    onClick={handleAddFilm}
                    disabled={!selectedFilmId || isAddingFilm || quantity < 1}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {quantity > 1 ? `${quantity} Films` : "Film"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tripFilms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No films reserved for this trip yet</p>
                  <p className="text-sm mt-2">
                    Add films using the selector above
                  </p>
                </div>
              ) : (
                <>
                  {/* Sort and Filter Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-muted-foreground" />
                      <Select value={isoFilter} onValueChange={setIsoFilter}>
                        <SelectTrigger className="w-[120px]">
                          <SelectValue placeholder="Filter ISO" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All ISOs</SelectItem>
                          {getUniqueISOs().map((iso) => (
                            <SelectItem key={iso} value={iso.toString()}>
                              ISO {iso}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {isoFilter && isoFilter !== "all" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setIsoFilter("all")}
                          className="h-8 px-2"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-sm text-muted-foreground mr-2">
                        Sort by:
                      </span>
                      <Button
                        variant={sortBy === "name" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => toggleSort("name")}
                        className="flex items-center gap-1"
                      >
                        Name
                        {sortBy === "name" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          ))}
                      </Button>
                      <Button
                        variant={sortBy === "iso" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => toggleSort("iso")}
                        className="flex items-center gap-1"
                      >
                        ISO
                        {sortBy === "iso" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          ))}
                      </Button>
                      <Button
                        variant={sortBy === "brand" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => toggleSort("brand")}
                        className="flex items-center gap-1"
                      >
                        Brand
                        {sortBy === "brand" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          ))}
                      </Button>
                      <Button
                        variant={sortBy === "quantity" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => toggleSort("quantity")}
                        className="flex items-center gap-1"
                      >
                        Quantity
                        {sortBy === "quantity" &&
                          (sortOrder === "asc" ? (
                            <SortAsc className="h-3 w-3" />
                          ) : (
                            <SortDesc className="h-3 w-3" />
                          ))}
                      </Button>
                    </div>
                  </div>
                </>
              )}

              {tripFilms.length > 0 && (
                <div className="space-y-3">
                  {getFilteredAndSortedFilms().map((film) => (
                    <div
                      key={film.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{film.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {film.brand} • {film.format} • ISO {film.iso}
                          </p>
                        </div>
                        {editingFilmId === film.id ? (
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="1"
                              value={editQuantity}
                              onChange={(e) =>
                                setEditQuantity(
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              className="w-16"
                            />
                            <span className="text-sm text-muted-foreground">
                              reserved
                            </span>
                          </div>
                        ) : (
                          <Badge variant="outline">
                            {film.reserved_quantity} reserved
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1.5"
                            >
                              <BookOpen className="h-3.5 w-3.5" />
                              Log Shots
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl">
                            <DialogHeader>
                              <DialogTitle>
                                Shot Logger: {film.name}
                              </DialogTitle>
                            </DialogHeader>
                            <ShotLogger
                              // eslint-disable-next-line @typescript-eslint/no-explicit-any
                              tripFilm={film as any}
                              gear={tripGear}
                            />
                          </DialogContent>
                        </Dialog>

                        <div className="flex items-center gap-1">
                          {editingFilmId === film.id ? (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSaveQuantity(film.id)}
                              >
                                Save
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleCancelEdit}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEditQuantity(
                                    film.id,
                                    film.reserved_quantity
                                  )
                                }
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFilm(film.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reserved Gear</CardTitle>
                  <CardDescription>
                    Photography gear you&apos;ve reserved for this trip
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedGearId}
                    onValueChange={setSelectedGearId}
                  >
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Select gear" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGear.map((gear) => (
                        <SelectItem key={gear.id} value={gear.id}>
                          {getGearTypeIcon(gear.type)} {gear.brand}{" "}
                          {gear.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAddGear}
                    disabled={!selectedGearId || isAddingGear}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Gear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tripGear.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No gear reserved for this trip yet</p>
                  <p className="text-sm mt-2">
                    Add gear using the selector above
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tripGear.map((gear) => (
                    <div
                      key={gear.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">
                          {getGearTypeIcon(gear.type)}
                        </span>
                        <div>
                          <p className="font-medium">{gear.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {gear.brand} • {gear.type}
                            {gear.model ? ` • ${gear.model}` : ""}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGear(gear.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}