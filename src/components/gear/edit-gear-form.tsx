"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { editGear, getGear } from "@/app/actions/gear";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import { GearFormFields } from "./gear-form-fields";
import type { Gear } from "@/lib/gear/types";
import type { GearSchema } from "@/lib/gear/schema";
import { gearSchema } from "@/lib/gear/schema";

interface EditGearProps {
  gear: Gear;
  onClose: () => void;
}

export function EditGear({ gear, onClose }: EditGearProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameras, setCameras] = useState<Gear[]>([]);

  const form = useForm<GearSchema>({
    resolver: zodResolver(gearSchema),
    defaultValues: {
      name: gear.name,
      brand: gear.brand,
      type: gear.type,
      model: gear.model || "",
      serial_number: gear.serial_number || "",
      purchase_date: gear.purchase_date || "",
      purchase_price: gear.purchase_price,
      condition: gear.condition,
      notes: gear.notes || "",
      camera_id: gear.camera_id || "none",
    },
  });

  const fetchCameras = useCallback(async () => {
    try {
      const result = await getGear();
      if (result.success && result.gear) {
        // Filter only cameras (excluding the current gear if it's a camera)
        const cameraList = result.gear.filter(g => g.type === 'camera' && g.id !== gear.id);
        setCameras(cameraList);
      }
    } catch (error) {
      console.error("Error fetching cameras:", error);
    }
  }, [gear.id]);

  useEffect(() => {
    // Fetch cameras when component mounts
    fetchCameras();
  }, [fetchCameras]);

  async function onSubmit(values: GearSchema) {
    try {
      setIsSubmitting(true);

      const result = await editGear(gear.id, values);

      if (!result.success) {
        throw new Error(result.error || "Failed to update gear");
      }

      toast.success("Gear has been updated");
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update gear"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>Edit Gear</DialogTitle>
          <DialogDescription>Update the details of your gear.</DialogDescription>
        </DialogHeader>

        <GearFormFields
          form={form}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitText="Update Gear"
          loadingText="Updating..."
          cameras={cameras}
        />
      </DialogContent>
    </Dialog>
  );
}
