"use client";

import { memo, useState, useCallback } from "react";
import { Gear, getConditionColor, getGearTypeIcon } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Camera } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EditGear } from "./edit-gear-form";
import { DeleteGearDialog } from "./delete-gear-dialog";

interface GearCardProps {
  item: Gear;
  onEdit: (item: Gear) => void;
  onDelete: (item: Gear) => void;
}

// Memoized card component to prevent re-renders when other cards change (rerender-memo)
const GearCard = memo(function GearCard({ item, onEdit, onDelete }: GearCardProps) {
  return (
    <Card className="bg-gradient-to-br from-zinc-500/10 to-zinc-600/10 border-[#2a2420] transition-[border-color,transform,box-shadow] duration-300 ease-[cubic-bezier(0.2,0,0,1)] hover:-translate-y-1 hover:border-[#3a3430]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getGearTypeIcon(item.type)}</span>
            <span
              className="truncate text-[#e8e4e0]"
              style={{ fontFamily: 'Georgia, serif' }}
            >
              {item.name}
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(item)}
              className="text-[#8a8078] hover:text-[#e8e4e0]"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(item)}
              className="text-[#8a8078] hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-[#8a8078]">Brand</span>
          <span className="font-medium text-[#e8e4e0]">{item.brand}</span>
        </div>

        {item.model && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#8a8078]">Model</span>
            <span className="font-medium text-[#e8e4e0]">{item.model}</span>
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-[#8a8078]">Type</span>
          <Badge variant="outline" className="capitalize">
            {item.type}
          </Badge>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-[#8a8078]">Condition</span>
          <Badge className={getConditionColor(item.condition)}>
            {item.condition}
          </Badge>
        </div>

        {item.purchase_price && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#8a8078]">Value</span>
            <span className="font-medium text-[#e8e4e0] font-variant-numeric tabular-nums">
              {'\u20AC'}{item.purchase_price.toFixed(2)}
            </span>
          </div>
        )}

        {item.notes && (
          <div className="mt-3 pt-3 border-t border-[#2a2420]">
            <p className="text-sm text-[#8a8078] line-clamp-2">
              {item.notes}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
});

interface GearGridProps {
  gear: Gear[];
}

export function GearGrid({ gear }: GearGridProps) {
  const [editingGear, setEditingGear] = useState<Gear | null>(null);
  const [deletingGear, setDeletingGear] = useState<Gear | null>(null);

  // Stable callbacks to prevent GearCard re-renders (rerender-functional-setstate)
  const handleEdit = useCallback((item: Gear) => setEditingGear(item), []);
  const handleDelete = useCallback((item: Gear) => setDeletingGear(item), []);

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
          <GearCard
            key={item.id}
            item={item}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
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
