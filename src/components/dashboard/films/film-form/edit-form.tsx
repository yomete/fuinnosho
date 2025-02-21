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
