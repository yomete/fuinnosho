"use client";

import { useState, useTransition } from "react";
import { Film } from "@/lib/utils";
import { restoreFilm, permanentlyDeleteFilm } from "@/app/actions/films";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RotateCcw, Trash2 } from "lucide-react";

interface DeletedFilmsTableProps {
  films: Film[];
  onUpdate: () => void;
}

export function DeletedFilmsTable({ films, onUpdate }: DeletedFilmsTableProps) {
  const [isPending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<Film | null>(null);

  const handleRestore = (film: Film) => {
    startTransition(async () => {
      const result = await restoreFilm(film.id);
      if (result.success) {
        onUpdate();
      }
    });
  };

  const handlePermanentDelete = () => {
    if (!confirmDelete) return;
    startTransition(async () => {
      const result = await permanentlyDeleteFilm(confirmDelete.id);
      if (result.success) {
        setConfirmDelete(null);
        onUpdate();
      }
    });
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (films.length === 0) {
    return (
      <div className="text-center py-8 text-[#8a8078]">
        No deleted films
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Film</TableHead>
            <TableHead>Format</TableHead>
            <TableHead>Deleted</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {films.map((film) => (
            <TableRow key={film.id}>
              <TableCell>
                <div>
                  <span className="font-medium">{film.name}</span>
                  <span className="text-[#8a8078] ml-2">{film.brand}</span>
                </div>
              </TableCell>
              <TableCell>{film.format}</TableCell>
              <TableCell className="text-[#8a8078]">
                {formatDate(film.deleted_at)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRestore(film)}
                    disabled={isPending}
                    className="text-green-500 hover:text-green-400 hover:bg-green-500/10"
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Restore
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setConfirmDelete(film)}
                    disabled={isPending}
                    className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!confirmDelete} onOpenChange={() => setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permanently Delete Film?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{confirmDelete?.name}</strong> from
              the database. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setConfirmDelete(null)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handlePermanentDelete}
              disabled={isPending}
            >
              {isPending ? "Deleting..." : "Delete Permanently"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
