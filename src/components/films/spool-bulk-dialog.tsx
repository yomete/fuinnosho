"use client";

import { useState } from "react";
import { spoolBulkFilm } from "@/app/actions/films";
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
import { Scissors } from "lucide-react";
import { formatDimensions } from "@/lib/utils";

interface SpoolBulkDialogProps {
  filmId: string;
  filmName: string;
  format: string;
  remainingExposures?: number;
  spooledCassettes?: number;
  onSpoolingComplete?: (remainingExposures: number, spooledCassettes: number) => void;
}

export function SpoolBulkDialog({
  filmId,
  filmName,
  format,
  remainingExposures = 0,
  spooledCassettes = 0,
  onSpoolingComplete,
}: SpoolBulkDialogProps) {
  const [open, setOpen] = useState(false);
  const [exposuresToSpool, setExposuresToSpool] = useState<number | null>(null);
  const [cassettesCreated, setCassettesCreated] = useState(1);
  const [spoolNote, setSpoolNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatInfo = formatDimensions[format as keyof typeof formatDimensions];
  const exposuresPerRoll = 'rollLength' in formatInfo ? formatInfo.rollLength : 'sheetsPerBox' in formatInfo ? formatInfo.sheetsPerBox : 36;

  // Calculate suggested exposures based on cassettes
  const suggestedExposures = cassettesCreated * exposuresPerRoll;

  const handleSubmit = async () => {
    if (!exposuresToSpool || exposuresToSpool <= 0 || cassettesCreated <= 0 || !spoolNote.trim()) return;

    setIsSubmitting(true);
    const result = await spoolBulkFilm(filmId, exposuresToSpool, cassettesCreated, spoolNote.trim());

    if (result.success && result.remainingExposures !== undefined && result.spooledCassettes !== undefined) {
      onSpoolingComplete?.(result.remainingExposures, result.spooledCassettes);
      setOpen(false);
      setExposuresToSpool(null);
      setCassettesCreated(1);
      setSpoolNote("");
    } else if (result.error) {
      alert(`Error: ${result.error}`);
    }

    setIsSubmitting(false);
  };

  // Auto-suggest exposures when cassettes change
  const handleCassettesChange = (newCassettes: number) => {
    setCassettesCreated(newCassettes);
    if (!exposuresToSpool) {
      setExposuresToSpool(newCassettes * exposuresPerRoll);
    }
  };

  const isValid = exposuresToSpool && exposuresToSpool > 0 && cassettesCreated > 0 && spoolNote.trim() && exposuresToSpool <= remainingExposures;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-orange-600 hover:text-orange-700">
          <Scissors className="h-4 w-4 mr-1" />
          Spool
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Spool Bulk Film into Cassettes</DialogTitle>
          <DialogDescription>
            Create film cassettes from {filmName}. Remaining: {remainingExposures} exposures | Already spooled: {spooledCassettes} cassettes
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="cassettes" className="text-right">
              Cassettes
            </Label>
            <Input
              id="cassettes"
              type="number"
              min="1"
              value={cassettesCreated}
              onChange={(e) => handleCassettesChange(parseInt(e.target.value) || 1)}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="exposures" className="text-right">
              Exposures to use
            </Label>
            <div className="col-span-3 space-y-2">
              <Input
                id="exposures"
                type="number"
                min="1"
                max={remainingExposures}
                value={exposuresToSpool || ""}
                onChange={(e) => setExposuresToSpool(parseInt(e.target.value) || null)}
                placeholder={`Suggested: ${suggestedExposures}`}
              />
              <div className="text-xs text-muted-foreground">
                Suggested: {suggestedExposures} exposures ({cassettesCreated} × {exposuresPerRoll} exposures/roll)
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="spool-note" className="text-right">
              Notes
            </Label>
            <Textarea
              id="spool-note"
              placeholder="e.g., Spooled into cassettes for street photography"
              value={spoolNote}
              onChange={(e) => setSpoolNote(e.target.value)}
              className="col-span-3"
            />
          </div>
          {exposuresToSpool && exposuresToSpool > remainingExposures && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200">
              <strong>Not enough bulk film remaining!</strong> You only have {remainingExposures} exposures left.
            </div>
          )}
        </div>
        <DialogFooter>
          <Button 
            type="submit" 
            onClick={handleSubmit} 
            disabled={isSubmitting || !isValid}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {isSubmitting ? "Spooling..." : "Spool Film"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}