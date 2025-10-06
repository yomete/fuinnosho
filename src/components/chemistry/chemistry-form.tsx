"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChemistryInventory,
  ChemistryInventorySchema,
  chemistryInventorySchema,
  chemistryTypes,
  processTypes,
} from "@/lib/utils";
import { createChemistry, editChemistry } from "@/app/actions/chemistry";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Edit } from "lucide-react";

interface ChemistryFormProps {
  chemistry?: ChemistryInventory;
  defaultProcessType?: 'black_white' | 'color';
}

export function ChemistryForm({ chemistry, defaultProcessType }: ChemistryFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ChemistryInventorySchema>({
    resolver: zodResolver(chemistryInventorySchema),
    defaultValues: chemistry
      ? {
          name: chemistry.name,
          brand: chemistry.brand || "",
          chemistry_type: chemistry.chemistry_type,
          process_type: chemistry.process_type,
          volume_ml: chemistry.volume_ml,
          original_volume_ml: chemistry.original_volume_ml,
          purchase_date: chemistry.purchase_date || "",
          expiry_date: chemistry.expiry_date || "",
          opened_date: chemistry.opened_date || "",
          cost: chemistry.cost || undefined,
          storage_location: chemistry.storage_location || "",
          notes: chemistry.notes || "",
          max_reuses: chemistry.max_reuses,
          times_used: chemistry.times_used,
          total_volume_processed_ml: chemistry.total_volume_processed_ml,
        }
      : {
          name: "",
          brand: "",
          chemistry_type: "developer",
          process_type: defaultProcessType || "black_white",
          volume_ml: 0,
          original_volume_ml: 0,
          purchase_date: "",
          expiry_date: "",
          opened_date: "",
          cost: undefined,
          storage_location: "",
          notes: "",
          max_reuses: 1,
          times_used: 0,
          total_volume_processed_ml: 0,
        },
  });

  async function onSubmit(data: ChemistryInventorySchema) {
    setIsSubmitting(true);
    try {
      const result = chemistry
        ? await editChemistry(chemistry.id, data)
        : await createChemistry(data);

      if (result.success) {
        toast.success(
          chemistry
            ? "Chemistry updated successfully"
            : "Chemistry added successfully"
        );
        setOpen(false);
        form.reset();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {chemistry ? (
          <Button variant="ghost" size="sm">
            <Edit className="h-4 w-4" />
          </Button>
        ) : (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Chemistry
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {chemistry ? "Edit Chemistry" : "Add New Chemistry"}
          </DialogTitle>
          <DialogDescription>
            {chemistry
              ? "Update the chemistry details below"
              : "Add a new chemistry bottle to your inventory"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Rodinal, HC-110, etc." {...field} />
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
                    <FormLabel>Brand (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Kodak, Ilford, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="chemistry_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chemistry Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {chemistryTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="process_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Process Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select process" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {processTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="volume_ml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Volume (ml)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="original_volume_ml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Volume (ml)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="expiry_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expiry Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="opened_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Opened Date (Optional)</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cost"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        value={field.value || ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value ? parseFloat(e.target.value) : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="storage_location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Storage Location (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Shelf A, Fridge, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="max_reuses"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Reuses</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {chemistry && (
                <FormField
                  control={form.control}
                  name="times_used"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Times Used</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Additional notes about this chemistry..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting
                  ? "Saving..."
                  : chemistry
                  ? "Update Chemistry"
                  : "Add Chemistry"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
