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
import { deleteGear } from "@/app/actions/gear";
import { toast } from "sonner";
import type { Gear } from "@/lib/gear/types";
import { Loader2 } from "lucide-react";

interface DeleteGearDialogProps {
  gear: Gear;
  onClose: () => void;
}

export function DeleteGearDialog({ gear, onClose }: DeleteGearDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    try {
      setIsDeleting(true);

      const result = await deleteGear(gear.id);

      if (!result.success) {
        throw new Error(result.error || "Failed to delete gear");
      }

      toast.success("Gear has been deleted");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete gear"
      );
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Gear</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete &quot;{gear.name}&quot;? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={isDeleting}
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
