"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { deleteFilm, editFilm } from "@/app/actions/films";
import { toast } from "sonner";
import { useState } from "react";
import { type Film } from "@/lib/utils";
import { FilmFormFields } from "./film-form-fields";
import { FilmSchema, filmSchema } from "@/lib/utils";

interface EditFilmProps {
  film: Film;
}

export function EditFilm({ film }: EditFilmProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FilmSchema>({
    resolver: zodResolver(filmSchema),
    defaultValues: {
      name: film.name,
      brand: film.brand,
      iso: film.iso,
      format: film.format,
      type: film.type,
      expiration_date: film.expiration_date,
      count: Number(film.count) || 1,
      price: Number(film.price) || 0,
      notes: film.notes || "",
      editing_notes: film.editing_notes || "",
      is_ecn: film.is_ecn || false,
      is_bulk_film: film.is_bulk_film || false,
      bulk_length_meters: film.bulk_length_meters ? Number(film.bulk_length_meters) : undefined,
      bulk_quantity: film.bulk_quantity ? Number(film.bulk_quantity) : undefined,
      calculated_rolls: film.calculated_rolls ? Number(film.calculated_rolls) : undefined,
      bulk_remaining_exposures: film.bulk_remaining_exposures ? Number(film.bulk_remaining_exposures) : undefined,
      spooled_cassettes: film.spooled_cassettes ? Number(film.spooled_cassettes) : undefined,
    },
  });

  async function onSubmit(values: FilmSchema) {
    const count = Number(values.count) || 1;
    const price = Number(values.price) || 0;
    const notes = values.notes || "";

    try {
      setIsSubmitting(true);
      const result = await editFilm(film.id, {
        ...values,
        count,
        price,
        notes,
      });

      console.log("🚀 ~ onSubmit ~ result:", result);

      if (!result.success) {
        throw new Error(result.error || "Failed to edit film");
      }

      toast.success("Film has been edited");
      form.reset();
      setIsOpen(false);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to edit film"
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    console.log("Deleting film", film.id);
    const result = await deleteFilm(film.id);
    if (result.success) {
      toast.success(result.message || "Film deleted successfully");
    }
  }

  const DeleteFilmButton = () => {
    return (
      <Button type="button" variant="destructive" onClick={handleDelete}>
        Delete
      </Button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Film</DialogTitle>
          <DialogDescription>Edit the film details.</DialogDescription>
        </DialogHeader>

        <FilmFormFields
          form={form}
          onSubmit={onSubmit}
          isSubmitting={isSubmitting}
          submitText="Edit Film"
          loadingText="Editing..."
          deleteButton={<DeleteFilmButton />}
        />
      </DialogContent>
    </Dialog>
  );
}
