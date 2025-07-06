"use client";

import { Gear, getConditionColor, getGearTypeIcon } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Camera } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EditGear } from "./edit-gear-form";
import { DeleteGearDialog } from "./delete-gear-dialog";
import { useState } from "react";

interface GearGridProps {
  gear: Gear[];
}

export function GearGrid({ gear }: GearGridProps) {
  const [editingGear, setEditingGear] = useState<Gear | null>(null);
  const [deletingGear, setDeletingGear] = useState<Gear | null>(null);

  if (!gear.length) {
    return (
      <EmptyState
        icon={Camera}
        title="No gear yet"
        description="Start building your gear collection by adding your first camera, lens, or accessory."
      />
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-4">
        {gear.map((item) => (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{getGearTypeIcon(item.type)}</span>
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingGear(item)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingGear(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Brand</span>
                <span className="font-medium">{item.brand}</span>
              </div>
              
              {item.model && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Model</span>
                  <span className="font-medium">{item.model}</span>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="outline" className="capitalize">
                  {item.type}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Condition</span>
                <Badge className={getConditionColor(item.condition)}>
                  {item.condition}
                </Badge>
              </div>

              {item.purchase_price && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Value</span>
                  <span className="font-medium">€{item.purchase_price.toFixed(2)}</span>
                </div>
              )}

              {item.notes && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {item.notes}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {editingGear && (
        <EditGear
          gear={editingGear}
          onClose={() => setEditingGear(null)}
        />
      )}

      {deletingGear && (
        <DeleteGearDialog
          gear={deletingGear}
          onClose={() => setDeletingGear(null)}
        />
      )}
    </>
  );
}