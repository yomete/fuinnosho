"use client";

import { useState } from "react";
import { finishBulkRoll } from "@/app/actions/films";
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
import { CheckCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface FinishBulkRollButtonProps {
  filmId: string;
  currentRoll: number;
  totalRolls: number;
  bulkRollsUsed: number;
}

export function FinishBulkRollButton({
  filmId,
  currentRoll,
  totalRolls,
  bulkRollsUsed,
}: FinishBulkRollButtonProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleFinishRoll = async () => {
    setIsSubmitting(true);
    const result = await finishBulkRoll(filmId);

    if (result.success) {
      setOpen(false);
      router.refresh();
    } else if (result.error) {
      alert(`Error: ${result.error}`);
    }

    setIsSubmitting(false);
  };

  const isLastRoll = bulkRollsUsed >= totalRolls - 1;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="text-green-600 hover:text-green-700"
          disabled={bulkRollsUsed >= totalRolls}
        >
          <CheckCircle2 className="h-4 w-4 mr-1" />
          Mark Roll {currentRoll} Complete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark Bulk Roll as Complete?</DialogTitle>
          <DialogDescription>
            This will mark roll {currentRoll} of {totalRolls} as finished.
            {isLastRoll && (
              <span className="block mt-2 font-medium text-foreground">
                This is the last roll in this bulk film package.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleFinishRoll}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting ? "Marking..." : "Mark Complete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
