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
import { Input } from "@/components/ui/input";
import { Camera, Trash2, Edit } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { EditGear } from "./edit-gear-form";
import { DeleteGearDialog } from "./delete-gear-dialog";

interface GearTableProps {
  gear: Gear[];
}

export function GearTable({ gear }: GearTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editingGear, setEditingGear] = useState<Gear | null>(null);
  const [deletingGear, setDeletingGear] = useState<Gear | null>(null);

  const filteredGear = gear.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.model && item.model.toLowerCase().includes(searchTerm.toLowerCase()))
  );


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
        title="No gear yet"
        description="Add your first piece of photography equipment to get started"
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {/* Search */}
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search gear..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Condition</TableHead>
                <TableHead>Purchase Date</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGear.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getGearTypeIcon(item.type)}</span>
                      {item.name}
                    </div>
                  </TableCell>
                  <TableCell>{item.brand}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.model || "-"}</TableCell>
                  <TableCell>
                    <Badge className={getConditionColor(item.condition)}>
                      {item.condition.charAt(0).toUpperCase() + item.condition.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDateSafe(item.purchase_date)}</TableCell>
                  <TableCell>{formatPrice(item.purchase_price)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingGear(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDeletingGear(item)}
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

        {filteredGear.length === 0 && searchTerm && (
          <div className="text-center py-8 text-muted-foreground">
            No gear found matching &quot;{searchTerm}&quot;
          </div>
        )}
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