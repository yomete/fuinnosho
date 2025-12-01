"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Film } from "@/lib/utils";
import { FilmGroup } from "@/lib/film-grouping";
import { Calendar, Package } from "lucide-react";

interface SelectFilmFromGroupDialogProps {
  filmGroup: FilmGroup;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFilmSelected: (film: Film) => void;
}

export function SelectFilmFromGroupDialog({
  filmGroup,
  open,
  onOpenChange,
  onFilmSelected,
}: SelectFilmFromGroupDialogProps) {
  const [selectedFilmId, setSelectedFilmId] = useState<string>(
    filmGroup.films[0]?.id || ""
  );

  const handleContinue = () => {
    const selectedFilm = filmGroup.films.find(
      (film) => film.id === selectedFilmId
    );
    if (selectedFilm) {
      onFilmSelected(selectedFilm);
      onOpenChange(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getAvailableCount = (film: Film) => {
    return typeof film.available_count === "number"
      ? film.available_count
      : film.count || 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select Film to Use</DialogTitle>
          <DialogDescription>
            Choose which batch to use from your {filmGroup.name} inventory
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <RadioGroup value={selectedFilmId} onValueChange={setSelectedFilmId}>
            <div className="space-y-3">
              {filmGroup.films.map((film) => {
                const availableCount = getAvailableCount(film);
                return (
                  <div
                    key={film.id}
                    className={`flex items-start space-x-3 rounded-md border p-3 transition-colors ${
                      selectedFilmId === film.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={film.id} id={film.id} className="mt-1" />
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={film.id}
                        className="cursor-pointer font-normal"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium">
                            Expires: {formatDate(film.expiration_date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm mt-1">
                          <Package className="h-3.5 w-3.5 text-muted-foreground" />
                          <span>
                            Available: {availableCount}{" "}
                            {availableCount === 1 ? "roll" : "rolls"}
                          </span>
                        </div>
                        {film.notes && (
                          <div className="text-xs text-muted-foreground mt-1.5">
                            {film.notes}
                          </div>
                        )}
                      </Label>
                    </div>
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleContinue}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
