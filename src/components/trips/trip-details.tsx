"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getGearTypeIcon,
  formatTripDateRange,
  formatTripDuration,
} from "@/lib/utils";
import type { Trip } from "@/lib/trips/types";
import type { Gear } from "@/lib/gear/types";
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
} from "lucide-react";
import { LoadingSpinner } from "@/components/ui/spinner";
import { useDemoPrefix } from "@/lib/use-demo-prefix";

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
  const prefix = useDemoPrefix();
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

  const loadTripData = async () => {
    const [filmsResult, gearResult, availableFilmsResult] = await Promise.all([
      getTripWithFilms(trip.id),
      getTripWithGear(trip.id),
      getFilmsWithAvailability(),
    ]);

    if (filmsResult.films) {
      setTripFilms(filmsResult.films);
    }

    if (gearResult.gear) {
      setTripGear(gearResult.gear);
    }

    // Load available films - only show films with actual availability
    if (availableFilmsResult.data) {
      const filmsToShow = availableFilmsResult.data.filter((film) => film.available_count > 0);
      setAvailableFilms(filmsToShow);
    }

    setIsLoading(false);
  };

  const loadAvailableFilms = async () => {
    const result = await getFilmsWithAvailability();
    if (result.data) {
      // Only show films with actual availability
      const filmsToShow = result.data.filter((film) => film.available_count > 0);
      setAvailableFilms(filmsToShow);
    }
  };

  const loadAvailableGear = async () => {
    const result = await getAvailableGear();
    if (result.data) {
      // Filter out gear that's already reserved for this trip
      const filteredGear = result.data.filter(
        (gear) => !tripGear.some((reserved) => reserved.id === gear.id)
      );
      setAvailableGear(filteredGear);
    }
  };

  useEffect(() => {
    loadTripData();
  }, [loadTripData]);

  useEffect(() => {
    loadAvailableGear();
  }, [loadAvailableGear]);

  const handleAddFilm = async () => {
    if (!selectedFilmId || quantity < 1) return;

    const selectedFilm = availableFilms.find((f) => f.id === selectedFilmId);

    if (!selectedFilm || quantity > selectedFilm.available_count) {
      alert(
        `Cannot add ${quantity} films. Only ${selectedFilm?.available_count || 0} available.`
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
          router.push(`${prefix}/trips`);
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
    <div className="container mx-auto px-4 py-6 sm:py-8 overflow-x-hidden">
      <div className="max-w-4xl mx-auto w-full">
        <div className="mb-6">
          {onBack ? (
            <Button variant="ghost" onClick={onBack} className="mb-4 text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36]">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Trips
            </Button>
          ) : (
            <Link href={`${prefix}/trips`}>
              <Button variant="ghost" className="mb-4 text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36]">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Trips
              </Button>
            </Link>
          )}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2 text-[#e8e4e0]">{trip.title}</h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#8a8078]">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 flex-shrink-0" />
                  <span className="text-sm sm:text-base">{formatTripDateRange(trip.start_date, trip.end_date)}</span>
                </div>
                <div className="flex items-center text-sm">
                  <MapPin className="h-4 w-4 mr-1 flex-shrink-0" />
                  {formatTripDuration(trip.start_date, trip.end_date)}
                </div>
              </div>
            </div>

            <Button variant="destructive" size="sm" onClick={handleDeleteTrip} className="bg-[#8b2942] hover:bg-[#a33352] text-[#e8e4e0] self-start sm:flex-shrink-0">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Trip
            </Button>
          </div>
        </div>

        <div className="grid gap-6">
          <Card className="bg-[#2a2825] border-[#3d3a36] overflow-hidden">
            <CardHeader>
              <CardTitle className="text-[#e8e4e0]">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-[#8a8078] break-words">{trip.description}</p>
            </CardContent>
          </Card>

          <Card className="bg-[#2a2825] border-[#3d3a36] overflow-hidden">
            <CardHeader className="space-y-4">
              <div>
                <CardTitle className="text-[#e8e4e0]">Reserved Films</CardTitle>
                <CardDescription className="text-[#8a8078]">
                  Films you&apos;ve reserved for this trip
                  {tripFilms.length > 0 && (
                    <span className="ml-2 font-medium text-[#e8e4e0]">
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
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Select
                  value={selectedFilmId}
                  onValueChange={setSelectedFilmId}
                >
                  <SelectTrigger className="w-full sm:w-[200px] bg-[#2a2825] border-[#3d3a36] text-[#e8e4e0]">
                    <SelectValue placeholder="Select a film" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2825] border-[#3d3a36]">
                    {availableFilms.map((film) => {
                      const expiryDate = film.expiration_date
                        ? new Date(film.expiration_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
                        : '';
                      return (
                        <SelectItem key={film.id} value={film.id} className="text-[#e8e4e0] focus:bg-[#3d3a36] focus:text-[#e8e4e0]">
                          {film.name}
                          {expiryDate && ` • Exp: ${expiryDate}`}
                          {' '}({film.available_count} available)
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max={
                      selectedFilmId
                        ? availableFilms.find((f) => f.id === selectedFilmId)?.available_count || 1
                        : 1
                    }
                    value={quantity}
                    onChange={(e) =>
                      setQuantity(
                        Math.max(1, parseInt(e.target.value) || 1)
                      )
                    }
                    className="w-20 bg-[#2a2825] border-[#3d3a36] text-[#e8e4e0]"
                    placeholder="Qty"
                  />
                  <Button
                    onClick={handleAddFilm}
                    disabled={!selectedFilmId || isAddingFilm || quantity < 1}
                    size="sm"
                    className="flex-1 sm:flex-initial bg-[#3d3a36] hover:bg-[#4a4641] text-[#e8e4e0] border border-[#5c5955]/30"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add {quantity > 1 ? `${quantity} Films` : "Film"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {tripFilms.length === 0 ? (
                <div className="text-center py-8 text-[#8a8078]">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No films reserved for this trip yet</p>
                  <p className="text-sm mt-2">
                    Add films using the selector above
                  </p>
                </div>
              ) : (
                <>
                  {/* Sort and Filter Controls */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4 p-3 bg-[#1e1c1a] rounded-lg border border-[#3d3a36]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-[#8a8078]" />
                      <Select value={isoFilter} onValueChange={setIsoFilter}>
                        <SelectTrigger className="w-[120px] bg-[#2a2825] border-[#3d3a36] text-[#e8e4e0]">
                          <SelectValue placeholder="Filter ISO" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2a2825] border-[#3d3a36]">
                          <SelectItem value="all" className="text-[#e8e4e0] focus:bg-[#3d3a36] focus:text-[#e8e4e0]">All ISOs</SelectItem>
                          {getUniqueISOs().map((iso) => (
                            <SelectItem key={iso} value={iso.toString()} className="text-[#e8e4e0] focus:bg-[#3d3a36] focus:text-[#e8e4e0]">
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
                          className="h-8 px-2 text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36]"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-sm text-[#8a8078] mr-2">
                        Sort by:
                      </span>
                      <Button
                        variant={sortBy === "name" ? "secondary" : "ghost"}
                        size="sm"
                        onClick={() => toggleSort("name")}
                        className={`flex items-center gap-1 ${sortBy === "name" ? "bg-[#3d3a36] text-[#e8e4e0]" : "text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36]"}`}
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
                        className={`flex items-center gap-1 ${sortBy === "iso" ? "bg-[#3d3a36] text-[#e8e4e0]" : "text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36]"}`}
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
                        className={`flex items-center gap-1 ${sortBy === "brand" ? "bg-[#3d3a36] text-[#e8e4e0]" : "text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36]"}`}
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
                        className={`flex items-center gap-1 ${sortBy === "quantity" ? "bg-[#3d3a36] text-[#e8e4e0]" : "text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36]"}`}
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
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border border-[#3d3a36] rounded-lg bg-[#1e1c1a]"
                    >
                      <div className="flex items-start sm:items-center justify-between sm:justify-start gap-3 min-w-0">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#e8e4e0] truncate">{film.name}</p>
                          <p className="text-sm text-[#8a8078]">
                            {film.brand} • {film.format} • ISO {film.iso}
                          </p>
                        </div>
                        {editingFilmId !== film.id && (
                          <Badge variant="outline" className="border-[#5c5955] text-[#8a8078] flex-shrink-0 sm:hidden">
                            {film.reserved_quantity}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 flex-shrink-0 w-full sm:w-auto">
                        {editingFilmId === film.id ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Input
                              type="number"
                              min="1"
                              value={editQuantity}
                              onChange={(e) =>
                                setEditQuantity(
                                  Math.max(1, parseInt(e.target.value) || 1)
                                )
                              }
                              className="w-16 bg-[#2a2825] border-[#3d3a36] text-[#e8e4e0]"
                            />
                            <span className="text-sm text-[#8a8078] hidden sm:inline">
                              reserved
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveQuantity(film.id)}
                              className="text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36]"
                            >
                              Save
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={handleCancelEdit}
                              className="text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36]"
                            >
                              Cancel
                            </Button>
                          </div>
                        ) : (
                          <>
                            <Badge variant="outline" className="border-[#5c5955] text-[#8a8078] hidden sm:inline-flex">
                              {film.reserved_quantity} reserved
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleEditQuantity(
                                    film.id,
                                    film.reserved_quantity
                                  )
                                }
                                className="text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36]"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveFilm(film.id)}
                                className="text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36]"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-[#2a2825] border-[#3d3a36] overflow-hidden">
            <CardHeader className="space-y-4">
              <div>
                <CardTitle className="text-[#e8e4e0]">Reserved Gear</CardTitle>
                <CardDescription className="text-[#8a8078]">
                  Photography gear you&apos;ve reserved for this trip
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <Select
                  value={selectedGearId}
                  onValueChange={setSelectedGearId}
                >
                  <SelectTrigger className="w-full sm:w-[200px] bg-[#2a2825] border-[#3d3a36] text-[#e8e4e0]">
                    <SelectValue placeholder="Select gear" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#2a2825] border-[#3d3a36]">
                    {availableGear.map((gear) => (
                      <SelectItem key={gear.id} value={gear.id} className="text-[#e8e4e0] focus:bg-[#3d3a36] focus:text-[#e8e4e0]">
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
                  className="bg-[#3d3a36] hover:bg-[#4a4641] text-[#e8e4e0] border border-[#5c5955]/30"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Gear
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {tripGear.length === 0 ? (
                <div className="text-center py-8 text-[#8a8078]">
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
                      className="flex items-center justify-between gap-2 sm:gap-3 p-3 border border-[#3d3a36] rounded-lg bg-[#1e1c1a]"
                    >
                      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                        <span className="text-xl sm:text-2xl flex-shrink-0">
                          {getGearTypeIcon(gear.type)}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-[#e8e4e0] truncate">{gear.name}</p>
                          <p className="text-sm text-[#8a8078] truncate">
                            {gear.brand} • {gear.type}
                            {gear.model ? ` • ${gear.model}` : ""}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveGear(gear.id)}
                        className="text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36] flex-shrink-0"
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
