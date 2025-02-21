"use client";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { UseFormReturn } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";

export const filmFormSchema = z.object({
  barcode: z.string().min(1, "Barcode is required"),
  name: z.string().min(1, "Name is required"),
  brand: z.string().min(1, "Brand is required"),
  iso: z.coerce.number().min(1, "ISO is required"),
  format: z.string().min(1, "Format is required"),
  type: z.string().min(1, "Type is required"),
  expiration_date: z.string().min(1, "Expiration date is required"),
  count: z.number().min(1, "Count is required").optional(),
  price: z.number().min(0, "Price is required").optional(),
  notes: z.string().optional(),
});

export type FilmFormSchema = z.infer<typeof filmFormSchema>;

interface FilmFormFieldsProps {
  form: UseFormReturn<FilmFormSchema>;
  onSubmit: (values: FilmFormSchema) => Promise<void>;
  isSubmitting: boolean;
  submitText: string;
  loadingText: string;
}

export function FilmFormFields({
  form,
  onSubmit,
  isSubmitting,
  submitText,
  loadingText,
}: FilmFormFieldsProps) {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1 space-y-4">
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Barcode" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="brand"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Brand" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="iso"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="ISO" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="format"
              render={({ field }) => (
                <FormItem>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select Format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="35">35</SelectItem>
                      <SelectItem value="120">120</SelectItem>
                      <SelectItem value="4x5">4x5</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="expiration_date"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Expiration Date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right Column */}
          <div className="flex-1 space-y-4">
            <FormField
              control={form.control}
              name="count"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Count" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input placeholder="Price" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      placeholder="Notes"
                      className="min-h-[120px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="mr-2">{loadingText}</span>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </>
            ) : (
              submitText
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}
