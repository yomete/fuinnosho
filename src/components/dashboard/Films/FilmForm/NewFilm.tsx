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
import { createFilm } from "@/app/actions/films";
import { toast } from "sonner";
import { useState } from "react";
import {
  FilmFormFields,
  FilmFormSchema,
  filmFormSchema,
} from "./FilmFormFields";

export function NewFilm() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FilmFormSchema>({
    resolver: zodResolver(filmFormSchema),
    defaultValues: {
      barcode: "",
      name: "",
      brand: "",
      iso: undefined,
      format: "",
      type: "",
      expiration_date: "",
      count: undefined,
      price: undefined,
      notes: "",
    },
  });

  async function onSubmit(values: FilmFormSchema) {
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
        <Button variant="outline">Add Film</Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[680px]">
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
