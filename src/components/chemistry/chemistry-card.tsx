"use client";

import { useState } from "react";
import {
  ChemistryInventory,
  getVolumePercentage,
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

// Darkroom-themed chemistry type colors
function getDarkroomChemistryTypeColor(type: string): string {
  switch (type.toLowerCase()) {
    case "developer":
      return "bg-[#3d5c3d] text-[#a8d4a8] border-[#4a6b4a]"; // Green for developer
    case "stop_bath":
    case "stop bath":
      return "bg-[#5c4d3d] text-[#d4c4a8] border-[#6b5c4a]"; // Amber/yellow for stop bath
    case "fixer":
      return "bg-[#3d4d5c] text-[#a8c4d4] border-[#4a5c6b]"; // Blue for fixer
    case "wash_aid":
    case "wash aid":
      return "bg-[#4d3d5c] text-[#c4a8d4] border-[#5c4a6b]"; // Purple for wash aid
    case "wetting_agent":
    case "wetting agent":
      return "bg-[#3d5c5c] text-[#a8d4d4] border-[#4a6b6b]"; // Teal for wetting agent
    default:
      return "bg-[#3d3a36] text-[#8a8078] border-[#5c5955]"; // Default darkroom gray
  }
}

// Darkroom-themed volume status colors
function getDarkroomVolumeStatusColor(percentage: number): string {
  if (percentage <= 20) return "bg-[#8b2942]"; // Darkroom red
  if (percentage <= 50) return "bg-[#8b6b29]"; // Darkroom amber
  return "bg-[#3d5c3d]"; // Darkroom green
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
    <Card className="bg-[#2a2825] border-[#3d3a36] hover:border-[#5c5955] transition-all">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg text-[#e8e4e0]">{chemistry.name}</CardTitle>
            {chemistry.brand && (
              <p className="text-sm text-[#8a8078] mt-1">
                {chemistry.brand}
              </p>
            )}
          </div>
          <div className="flex gap-1">
            <ChemistryForm chemistry={chemistry} />
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" disabled={isDeleting} className="text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#3d3a36]">
                  <Trash2 className="h-4 w-4 text-[#8b2942]" />
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#2a2825] border-[#3d3a36]">
                <DialogHeader>
                  <DialogTitle className="text-[#e8e4e0]">Delete Chemistry</DialogTitle>
                  <DialogDescription className="text-[#8a8078]">
                    Are you sure you want to delete {chemistry.name}? This
                    action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    className="bg-[#2a2825] border-[#3d3a36] text-[#e8e4e0] hover:bg-[#3d3a36]"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleDelete}
                    variant="destructive"
                    disabled={isDeleting}
                    className="bg-[#8b2942] hover:bg-[#a33352] text-[#e8e4e0]"
                  >
                    {isDeleting ? "Deleting..." : "Delete"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-2">
          <Badge className={`border ${getDarkroomChemistryTypeColor(chemistry.chemistry_type)}`}>
            {chemistry.chemistry_type.replace("_", " ")}
          </Badge>

          {expiryStatus === "expired" && (
            <Badge className="bg-[#8b2942] text-[#e8e4e0] border-[#a33352]">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Expired
            </Badge>
          )}

          {expiryStatus === "warning" && (
            <Badge className="bg-[#5c4d3d] text-[#d4c4a8] border-[#6b5c4a]">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Expiring Soon
            </Badge>
          )}

          {volumePercentage < 20 && volumePercentage > 0 && (
            <Badge className="bg-[#8b2942] text-[#e8e4e0] border-[#a33352]">
              <Package className="h-3 w-3 mr-1" />
              Low Stock
            </Badge>
          )}

          {!canReuse && <Badge className="bg-[#8b2942] text-[#e8e4e0] border-[#a33352]">Max Reuses Reached</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Volume Progress */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-[#8a8078]">Volume Remaining</span>
            <span className="font-medium text-[#e8e4e0]">
              {chemistry.volume_ml}ml / {chemistry.original_volume_ml}ml
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#1e1c1a]">
            <div
              className={`h-full transition-all ${getDarkroomVolumeStatusColor(
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
              <span className="text-[#8a8078]">Reusability</span>
              <span className="font-medium text-[#e8e4e0]">
                {chemistry.times_used} / {chemistry.max_reuses} uses
              </span>
            </div>
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-[#1e1c1a]">
              <div
                className={`h-full transition-all ${
                  reusePercentage >= 90
                    ? "bg-[#8b2942]"
                    : reusePercentage >= 70
                    ? "bg-[#8b6b29]"
                    : "bg-[#3d5c3d]"
                }`}
                style={{ width: `${reusePercentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Details */}
        <div className="space-y-2 text-sm">
          {chemistry.storage_location && (
            <div className="flex items-center text-[#8a8078]">
              <MapPin className="h-4 w-4 mr-2" />
              {chemistry.storage_location}
            </div>
          )}

          {chemistry.expiry_date && (
            <div className="flex items-center text-[#8a8078]">
              <Calendar className="h-4 w-4 mr-2" />
              Expires: {formatDate(chemistry.expiry_date)}
            </div>
          )}

          {chemistry.opened_date && (
            <div className="flex items-center text-[#8a8078]">
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Opened: {formatDate(chemistry.opened_date)}
            </div>
          )}

          {chemistry.cost && (
            <div className="flex items-center text-[#8a8078]">
              <Euro className="h-4 w-4 mr-2" />
              {chemistry.cost.toFixed(2)}
            </div>
          )}
        </div>

        {chemistry.notes && (
          <div className="text-sm text-[#8a8078] border-t border-[#3d3a36] pt-3">
            {chemistry.notes}
          </div>
        )}

        {/* Mark as Opened Button */}
        {!chemistry.opened_date && (
          <Button
            variant="outline"
            size="sm"
            className="w-full bg-[#2a2825] border-[#3d3a36] text-[#e8e4e0] hover:bg-[#3d3a36] hover:border-[#5c5955]"
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
