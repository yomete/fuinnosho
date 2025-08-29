"use client";

import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
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
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import { FilmSchema, calculateRollsFromBulkFilm, getBulkFilmInfo } from "@/lib/utils";
import { BrandAutocomplete } from "@/components/ui/brand-autocomplete";
import { Switch } from "@/components/ui/switch";
import { useState, useEffect } from "react";

interface FilmFormFieldsProps {
  form: UseFormReturn<FilmSchema>;
  onSubmit: (values: FilmSchema) => Promise<void>;
  isSubmitting: boolean;
  submitText: string;
  loadingText: string;
  deleteButton?: React.ReactNode;
}

export function FilmFormFields({
  form,
  onSubmit,
  isSubmitting,
  submitText,
  loadingText,
  deleteButton,
}: FilmFormFieldsProps) {
  const [isBulkFilm, setIsBulkFilm] = useState(form.getValues("is_bulk_film") || false);
  const [bulkLength, setBulkLength] = useState(form.getValues("bulk_length_meters") || 0);
  const [bulkQuantity, setBulkQuantity] = useState(form.getValues("bulk_quantity") || 1);
  const [calculatedRolls, setCalculatedRolls] = useState(form.getValues("calculated_rolls") || 0);
  const format = form.watch("format");

  useEffect(() => {
    if (isBulkFilm && bulkLength > 0 && bulkQuantity > 0 && format) {
      const rolls = calculateRollsFromBulkFilm(bulkLength, format, bulkQuantity);
      setCalculatedRolls(rolls);
      form.setValue("calculated_rolls", rolls);
      form.setValue("count", rolls);
    } else if (!isBulkFilm) {
      setCalculatedRolls(0);
      form.setValue("calculated_rolls", undefined);
    }
  }, [isBulkFilm, bulkLength, bulkQuantity, format, form]);

  const handleSubmit = async (values: FilmSchema) => {
    await onSubmit(values);
  };

  const bulkFilmInfo = format ? getBulkFilmInfo(format) : null;
  const supportsBulk = bulkFilmInfo?.supportsBulk || false;

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit(handleSubmit)(e);
          }}
          className="space-y-4"
        >
          <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
            {/* Left Column */}
            <div className="flex-1 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter film name" {...field} />
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
                    <FormLabel>Brand</FormLabel>
                    <FormControl>
                      <BrandAutocomplete
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Enter brand name"
                      />
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
                    <FormLabel>ISO</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => {
                          const value = e.target.value
                            ? parseInt(e.target.value, 10)
                            : null;
                          field.onChange(value);
                        }}
                      />
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
                    <FormLabel>Format</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select film format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="35mm">35mm</SelectItem>
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select film type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Color Negative">
                          Color Negative
                        </SelectItem>
                        <SelectItem value="Black & White">
                          Black & White
                        </SelectItem>
                        <SelectItem value="Black & White Slide">
                          Black & White Slide
                        </SelectItem>
                        <SelectItem value="Color Slide">Color Slide</SelectItem>
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
                    <FormLabel>Expiration Date</FormLabel>
                    <FormControl>
                      <Input type="date" placeholder="YYYY-MM-DD" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {supportsBulk && (
                <FormField
                  control={form.control}
                  name="is_bulk_film"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel>
                          Bulk Film
                        </FormLabel>
                        <p className="text-sm text-muted-foreground">
                          This is bulk film (sold by length, not pre-rolled)
                        </p>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={(checked) => {
                            field.onChange(checked);
                            setIsBulkFilm(checked);
                            if (!checked) {
                              form.setValue("bulk_length_meters", undefined);
                              form.setValue("bulk_quantity", undefined);
                              form.setValue("calculated_rolls", undefined);
                              setBulkLength(0);
                              setBulkQuantity(1);
                              setCalculatedRolls(0);
                            }
                          }}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="is_ecn"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between">
                    <div className="space-y-0.5">
                      <FormLabel>
                        ECN Film
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        This is an ECN (Eastman Color Negative) motion picture film
                      </p>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Right Column */}
            <div className="flex-1 space-y-4">
              {isBulkFilm ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="bulk_quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Number of Bulk Rolls</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="How many bulk rolls?"
                              type="number"
                              min="1"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                  ? parseInt(e.target.value, 10)
                                  : 1;
                                field.onChange(value);
                                setBulkQuantity(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bulk_length_meters"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Length per Bulk (meters)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Length in meters"
                              type="number"
                              step="0.1"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => {
                                const value = e.target.value
                                  ? parseFloat(e.target.value)
                                  : 0;
                                field.onChange(value);
                                setBulkLength(value);
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2 p-4 bg-green-50 rounded-lg">
                    <label className="text-sm font-medium text-green-800">Total Calculated Rolls</label>
                    <div className="text-3xl font-bold text-green-600">
                      {calculatedRolls} rolls
                    </div>
                    <p className="text-xs text-green-700">
                      {bulkQuantity} × {bulkLength}m bulk = {bulkQuantity} × {Math.floor(bulkLength * 0.9 / (bulkFilmInfo?.lengthPerRoll || 1))} rolls each
                      <br />
                      Based on {bulkFilmInfo?.lengthPerRoll}m per roll (with 10% waste factor)
                    </p>
                  </div>
                </>
              ) : (
                <FormField
                  control={form.control}
                  name="count"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter quantity"
                          type="number"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseInt(e.target.value, 10)
                              : null;
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter price"
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const value = e.target.value
                            ? parseFloat(e.target.value)
                            : null;
                          field.onChange(value);
                        }}
                      />
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
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional notes"
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="editing_notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Editing Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add editing tips for this film stock"
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

          <DialogFooter className="flex justify-between">
            {deleteButton}
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
    </>
  );
}
