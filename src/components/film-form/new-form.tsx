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
import { createFilm } from "@/app/actions/films";
import { toast } from "sonner";
import { useState } from "react";
import { FilmFormFields } from "./film-form-fields";
import { FilmSchema, filmSchema } from "@/lib/utils";

export function NewFilm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FilmSchema>({
    resolver: zodResolver(filmSchema),
    defaultValues: {
      name: "",
      brand: "",
      iso: 0,
      format: "",
      type: "",
      expiration_date: "",
      count: 1,
      price: 0,
      notes: "",
      editing_notes: "",
      is_ecn: false,
      is_bulk_film: false,
      bulk_length_meters: undefined,
      bulk_quantity: undefined,
      calculated_rolls: undefined,
    },
  });

  async function onSubmit(values: FilmSchema) {
    try {
      setIsSubmitting(true);

      const result = await createFilm(values);

      if (!result.success) {
        throw new Error(result.error || "Failed to create film");
      }

      toast.success("Film has been added to your inventory");
      form.reset();
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to add film"
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
          Add Film
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Film</DialogTitle>
          <DialogDescription>Add a new film to the database.</DialogDescription>
        </DialogHeader>

        <FilmFormFields
          form={form}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitText="Add Film"
          loadingText="Adding..."
        />
      </DialogContent>
    </Dialog>
  );
}
