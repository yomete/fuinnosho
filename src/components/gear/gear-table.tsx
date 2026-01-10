"use client";
import { useState } from "react";
import { Gear, getConditionColor, getGearTypeIcon, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Camera, Trash2, Edit } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EditGear } from "./edit-gear-form";
import { DeleteGearDialog } from "./delete-gear-dialog";

interface GearTableProps {
  gear: Gear[];
}

export function GearTable({ gear }: GearTableProps) {
  const [editingGear, setEditingGear] = useState<Gear | null>(null);
  const [deletingGear, setDeletingGear] = useState<Gear | null>(null);

  const formatPrice = (price?: number) => {
    if (!price) return "-";
    return new Intl.NumberFormat("en-EU", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const formatDateSafe = (dateString?: string) => {
    if (!dateString) return "-";
    return formatDate(dateString);
  };

  if (gear.length === 0) {
    return (
      <EmptyState
        icon={Camera}
        title="No gear found"
        description="Try adjusting your filters or search terms"
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Table */}
        <div className="rounded-md border border-[#2a2420] overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-[#2a2420] hover:bg-[#1a1614]/50">
                <TableHead className="text-[#8a8078]">Name</TableHead>
                <TableHead className="text-[#8a8078]">Brand</TableHead>
                <TableHead className="text-[#8a8078]">Type</TableHead>
                <TableHead className="text-[#8a8078]">Model</TableHead>
                <TableHead className="text-[#8a8078]">Condition</TableHead>
                <TableHead className="text-[#8a8078]">Purchase Date</TableHead>
                <TableHead className="text-[#8a8078]">Price</TableHead>
                <TableHead className="text-[#8a8078]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gear.map((item) => (
                <TableRow key={item.id} className="border-[#2a2420] hover:bg-[#1a1614]/30">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getGearTypeIcon(item.type)}</span>
                      <span
                        className="text-[#e8e4e0]"
                        style={{ fontFamily: 'Georgia, serif' }}
                      >
                        {item.name}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#e8e4e0]">{item.brand}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#8a8078]">{item.model || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getConditionColor(item.condition)}>
                      {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#8a8078]">{formatDateSafe(item.purchase_date)}</TableCell>
                  <TableCell className="text-[#e8e4e0] font-variant-numeric tabular-nums">
                    {formatPrice(item.purchase_price)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingGear(item)}
                        className="text-[#8a8078] hover:text-[#e8e4e0]"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingGear(item)}
                        className="text-[#8a8078] hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Edit Dialog */}
      {editingGear && (
        <EditGear
          gear={editingGear}
          onClose={() => setEditingGear(null)}
        />
      )}

      {/* Delete Dialog */}
      {deletingGear && (
        <DeleteGearDialog
          gear={deletingGear}
          onClose={() => setDeletingGear(null)}
        />
      )}
    </>
  );
}
