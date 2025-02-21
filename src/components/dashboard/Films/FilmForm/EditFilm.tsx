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
import { editFilm } from "@/app/actions/films";
import { toast } from "sonner";
import { useState } from "react";
import { Film } from "../utils";
import {
  FilmFormFields,
  FilmFormSchema,
  filmFormSchema,
} from "./FilmFormFields";

interface EditFilmProps {
  film: Film;
}

export function EditFilm({ film }: EditFilmProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FilmFormSchema>({
    resolver: zodResolver(filmFormSchema),
    defaultValues: {
      barcode: film.barcode,
      name: film.name,
      brand: film.brand,
      iso: film.iso,
      format: film.format,
      type: film.type,
      expiration_date: film.expiration_date,
      count: film.count || 1,
      price: film.price || 0,
      notes: film.notes || "",
    },
  });

  async function onSubmit(values: FilmFormSchema) {
    const count = values.count || 1;
    const price = values.price || 0;
    const notes = values.notes || "";

    try {
      setIsSubmitting(true);
      const result = await editFilm(film.id, {
        ...values,
        count,
        price,
        notes,
      });

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

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Edit</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[680px]">
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
        />
      </DialogContent>
    </Dialog>
  );
}
