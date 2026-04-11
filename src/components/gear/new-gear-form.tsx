"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createGear, getGear } from "@/app/actions/gear";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { GearFormFields } from "./gear-form-fields";
import type { Gear } from "@/lib/gear/types";
import type { GearSchema } from "@/lib/gear/schema";
import { gearSchema } from "@/lib/gear/schema";

export function NewGear() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cameras, setCameras] = useState<Gear[]>([]);

  const form = useForm<GearSchema>({
    resolver: zodResolver(gearSchema),
    defaultValues: {
      name: "",
      brand: "",
      type: "camera",
      model: "",
      serial_number: "",
      purchase_date: "",
      purchase_price: undefined,
      condition: "good",
      notes: "",
      camera_id: "none",
    },
  });

  useEffect(() => {
    if (isOpen) {
      // Fetch cameras when dialog opens
      fetchCameras();
    }
  }, [isOpen]);

  async function fetchCameras() {
    try {
      const result = await getGear();
      if (result.success && result.gear) {
        // Filter only cameras
        const cameraList = result.gear.filter(gear => gear.type === 'camera');
        setCameras(cameraList);
      }
    } catch (error) {
      console.error("Error fetching cameras:", error);
    }
  }

  async function onSubmit(values: GearSchema) {
    try {
      setIsSubmitting(true);

      const result = await createGear(values);

      if (!result.success) {
        throw new Error(result.error || "Failed to create gear");
      }

      toast.success("Gear has been added to your collection");
      form.reset();
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add gear"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Gear
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[580px]">
        <DialogHeader>
          <DialogTitle>Add Gear</DialogTitle>
          <DialogDescription>Add new photography gear to your collection.</DialogDescription>
        </DialogHeader>

        <GearFormFields
          form={form}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitText="Add Gear"
          loadingText="Adding..."
          cameras={cameras}
        />
      </DialogContent>
    </Dialog>
  );
}
