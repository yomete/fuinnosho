"use client";

import { useState } from "react";
import { reduceFilmCount } from "@/app/actions/films";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MinusCircle } from "lucide-react";

interface ReduceCountDialogProps {
  filmId: string;
  filmName: string;
  currentCount?: number;
  onCountUpdated?: (newCount: number) => void;
}

export function ReduceCountDialog({
  filmId,
  filmName,
  currentCount = 0,
  onCountUpdated,
}: ReduceCountDialogProps) {
  const [open, setOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [usageNote, setUsageNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (quantity <= 0 || !usageNote.trim()) return;

    setIsSubmitting(true);
    const result = await reduceFilmCount(filmId, quantity, usageNote.trim());

    if (result.success && result.newCount !== undefined) {
      onCountUpdated?.(result.newCount);
      setOpen(false);
      setQuantity(1);
      setUsageNote("");
    }

    setIsSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <MinusCircle className="h-4 w-4 mr-1" />
          Use Film
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Film Usage</DialogTitle>
          <DialogDescription>
            Track how you used {filmName}. Current count: {currentCount}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="quantity" className="text-right">
              Quantity
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={currentCount}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="usage-note" className="text-right">
              Usage Note
            </Label>
            <Textarea
              id="usage-note"
              placeholder="e.g., Used for street photography project"
              value={usageNote}
              onChange={(e) => setUsageNote(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            Record Usage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}