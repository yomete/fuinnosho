"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Trip } from "@/lib/utils";
import { getTripWithFilms, addFilmToTrip, removeFilmFromTrip, deleteTrip, getFilmsWithAvailability } from "@/app/actions/trips";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Calendar, MapPin, Plus, Trash2, X } from "lucide-react";

interface TripDetailsProps {
  trip: Trip;
  onBack: () => void;
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

export function TripDetails({ trip, onBack }: TripDetailsProps) {
  const router = useRouter();
  const [tripFilms, setTripFilms] = useState<FilmWithReservedQuantity[]>([]);
  const [availableFilms, setAvailableFilms] = useState<FilmWithAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFilmId, setSelectedFilmId] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [isAddingFilm, setIsAddingFilm] = useState(false);

  const loadTripData = useCallback(async () => {
    const result = await getTripWithFilms(trip.id);
    if (result.films) {
      setTripFilms(result.films);
    }
    setIsLoading(false);
  }, [trip.id]);

  const loadAvailableFilms = useCallback(async () => {
    const result = await getFilmsWithAvailability();
    if (result.data) {
      setAvailableFilms(result.data.filter(film => film.available_count > 0));
    }
  }, []);

  useEffect(() => {
    loadTripData();
    loadAvailableFilms();
  }, [loadTripData, loadAvailableFilms]);

  const handleAddFilm = async () => {
    if (!selectedFilmId || quantity < 1) return;
    
    const selectedFilm = availableFilms.find(f => f.id === selectedFilmId);
    if (!selectedFilm || quantity > selectedFilm.available_count) {
      alert(`Cannot add ${quantity} films. Only ${selectedFilm?.available_count || 0} available.`);
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

  const handleDeleteTrip = async () => {
    if (confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
      const result = await deleteTrip(trip.id);
      
      if (result.success) {
        router.refresh();
        onBack();
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) >= new Date();
  };

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trips
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{trip.title}</h1>
              <div className="flex items-center gap-4 text-muted-foreground">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  {formatDate(trip.trip_date)}
                </div>
                <Badge variant={isUpcoming(trip.trip_date) ? "secondary" : "outline"}>
                  {isUpcoming(trip.trip_date) ? "Upcoming" : "Past"}
                </Badge>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Reserved Films</CardTitle>
                  <CardDescription>
                    Films you&apos;ve reserved for this trip
                  </CardDescription>
                </div>
                {isUpcoming(trip.trip_date) && (
                  <div className="flex items-center gap-2">
                    <Select value={selectedFilmId} onValueChange={setSelectedFilmId}>
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
                        max={selectedFilmId ? availableFilms.find(f => f.id === selectedFilmId)?.available_count || 1 : 1}
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
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
                      Add {quantity > 1 ? `${quantity} Films` : 'Film'}
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {tripFilms.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No films reserved for this trip yet</p>
                  {isUpcoming(trip.trip_date) && (
                    <p className="text-sm mt-2">Add films using the selector above</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3">
                  {tripFilms.map((film) => (
                    <div key={film.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-medium">{film.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {film.brand} • {film.format} • ISO {film.iso}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {film.reserved_quantity} reserved
                        </Badge>
                      </div>
                      
                      {isUpcoming(trip.trip_date) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveFilm(film.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
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