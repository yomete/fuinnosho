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
import { FilmFormFields } from "./FilmFormFields";
import { FilmSchema, filmSchema } from "@/lib/utils";

export function NewFilm() {
  const [isOpen, setIsOpen] = useState(false);
  console.log("🚀 ~ NewFilm ~ isOpen:", isOpen);
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
    },
  });

  async function onSubmit(values: FilmSchema) {
    console.log("NewFilm onSubmit called with values:", values);
    try {
      setIsSubmitting(true);

      console.log("🚀 ~ onSubmit ~ values:", values);
      const result = await createFilm(values);

      if (!result.success) {
        throw new Error(result.error || "Failed to create film");
      }

      toast.success("Film has been added to your inventory");
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.log("🚀 ~ onSubmit ~ error:", error);
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
