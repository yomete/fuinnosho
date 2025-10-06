"use client";

import { useState } from "react";
import {
  ChemistryInventory,
  getChemistryTypeColor,
  getVolumePercentage,
  getVolumeStatusColor,
  isChemistryExpiringSoon,
  canReuseChemistry,
  formatDate,
} from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import {
  deleteChemistry,
  markChemistryAsOpened,
} from "@/app/actions/chemistry";
import { ChemistryForm } from "./chemistry-form";
import { toast } from "sonner";
import {
  Trash2,
  MapPin,
  Calendar,
  Euro,
  AlertTriangle,
  CheckCircle2,
  Package,
} from "lucide-react";

interface ChemistryCardProps {
  chemistry: ChemistryInventory;
}

export function ChemistryCard({ chemistry }: ChemistryCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isMarkingOpened, setIsMarkingOpened] = useState(false);

  const volumePercentage = getVolumePercentage(
    chemistry.volume_ml,
    chemistry.original_volume_ml
  );
  const expiryStatus = isChemistryExpiringSoon(chemistry.expiry_date);
  const canReuse = canReuseChemistry(chemistry);
  const reusePercentage = (chemistry.times_used / chemistry.max_reuses) * 100;

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteChemistry(chemistry.id);
      if (result.success) {
        toast.success("Chemistry deleted successfully");
        setDeleteDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to delete chemistry");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMarkAsOpened = async () => {
    setIsMarkingOpened(true);
    try {
      const result = await markChemistryAsOpened(chemistry.id);
      if (result.success) {
        toast.success("Chemistry marked as opened");
      } else {
        toast.error(result.error || "Failed to mark chemistry as opened");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsMarkingOpened(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg">{chemistry.name}</CardTitle>
            {chemistry.brand && (
              <p className="text-sm text-muted-foreground mt-1">
                {chemistry.brand}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <ChemistryForm chemistry={chemistry} />
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isDeleting}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Chemistry</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete {chemistry.name}? This
                    action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    disabled={isDeleting}
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Badge className={getChemistryTypeColor(chemistry.chemistry_type)}>
            {chemistry.chemistry_type.replace("_", " ")}
          </Badge>

          {expiryStatus === "expired" && (
            <Badge variant="destructive">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Expired
            </Badge>
          )}

          {expiryStatus === "warning" && (
            <Badge className="bg-yellow-100 text-yellow-800">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Expiring Soon
            </Badge>
          )}

          {volumePercentage < 20 && volumePercentage > 0 && (
            <Badge variant="destructive">
              <Package className="h-3 w-3 mr-1" />
              Low Stock
            </Badge>
          )}

          {!canReuse && <Badge variant="destructive">Max Reuses Reached</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Volume Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Volume Remaining</span>
            <span className="font-medium">
              {chemistry.volume_ml}ml / {chemistry.original_volume_ml}ml
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
            <div
              className={`h-full transition-all ${getVolumeStatusColor(
                volumePercentage
              )}`}
              style={{ width: `${volumePercentage}%` }}
            />
          </div>
        </div>

        {/* Reuse Progress */}
        {chemistry.max_reuses > 1 && (
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Reusability</span>
              <span className="font-medium">
                {chemistry.times_used} / {chemistry.max_reuses} uses
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-primary/20">
              <div
                className={`h-full transition-all ${
                  reusePercentage >= 90
                    ? "bg-red-500"
                    : reusePercentage >= 70
                    ? "bg-yellow-500"
                    : "bg-green-500"
                }`}
                style={{ width: `${reusePercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm">
          {chemistry.storage_location && (
            <div className="flex items-center text-muted-foreground">
              <MapPin className="h-4 w-4 mr-2" />
              {chemistry.storage_location}
            </div>
          )}

          {chemistry.expiry_date && (
            <div className="flex items-center text-muted-foreground">
              <Calendar className="h-4 w-4 mr-2" />
              Expires: {formatDate(chemistry.expiry_date)}
            </div>
          )}

          {chemistry.opened_date && (
            <div className="flex items-center text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Opened: {formatDate(chemistry.opened_date)}
            </div>
          )}

          {chemistry.cost && (
            <div className="flex items-center text-muted-foreground">
              <Euro className="h-4 w-4 mr-2" />
              {chemistry.cost.toFixed(2)}
            </div>
          )}
        </div>

        {chemistry.notes && (
          <div className="text-sm text-muted-foreground border-t pt-3">
            {chemistry.notes}
          </div>
        )}

        {/* Mark as Opened Button */}
        {!chemistry.opened_date && (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleMarkAsOpened}
            disabled={isMarkingOpened}
          >
            {isMarkingOpened ? "Marking..." : "Mark as Opened"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
