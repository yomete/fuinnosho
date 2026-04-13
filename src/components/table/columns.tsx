"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Film, formatDate } from "@/lib/utils";
import { EditFilm } from "@/components/film-form/edit-form";
import { ReduceCountDialog } from "@/components/films/reduce-count-dialog";
import { UsageHistoryDialog } from "@/components/films/usage-history-dialog";
import { SpoolBulkDialog } from "@/components/films/spool-bulk-dialog";
import { SelectFilmFromGroupDialog } from "@/components/films/select-film-from-group-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  MoreHorizontal,
  Edit,
  History,
  Eye,
  ChevronRight,
  ChevronDown,
  MinusCircle,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { type TableRow, isFilmGroup } from "@/lib/film-grouping";
import { useDemoPrefix } from "@/lib/use-demo-prefix";

const ActionsCell = ({ row }: { row: { original: TableRow } }) => {
  const rowData: TableRow = row.original;
  const isGroup = isFilmGroup(rowData);
  const prefix = useDemoPrefix();

  // Always call hooks in the same order (Rules of Hooks)
  const [selectDialogOpen, setSelectDialogOpen] = useState(false);
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [reduceDialogOpen, setReduceDialogOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [filmData, setFilmData] = useState(isGroup ? ({} as Film) : (rowData as Film));

  // Sync local state when film prop changes
  useEffect(() => {
    if (!isGroup) {
      setFilmData(rowData as Film);
    }
  }, [rowData, isGroup]);

  // Handlers for grouped films
  const handleFilmSelected = (film: Film) => {
    setSelectedFilm(film);
    // Open reduce dialog after selection dialog is confirmed to close
    setTimeout(() => setReduceDialogOpen(true), 150);
  };

  const handleGroupCountUpdated = () => {
    setReduceDialogOpen(false);
    setSelectedFilm(null);
  };

  // Handlers for individual films
  const handleSpoolingComplete = (
    remainingExposures: number,
    spooledCassettes: number
  ) => {
    setFilmData((prev) => ({
      ...prev,
      bulk_remaining_exposures: remainingExposures,
      spooled_cassettes: spooledCassettes,
      count: spooledCassettes,
    }));
  };

  const handleCountUpdated = (newCount: number) => {
    setFilmData((prev) => ({
      ...prev,
      count: newCount,
      spooled_cassettes: filmData.is_bulk_film ? newCount : prev.spooled_cassettes,
    }));
  };

  // Render for FilmGroup
  if (isGroup) {
    const filmGroup = rowData;

    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation(); // Prevent row click from toggling expansion
            setSelectDialogOpen(true);
          }}
        >
          <MinusCircle className="h-4 w-4 mr-1" />
          Use Film
        </Button>

        <SelectFilmFromGroupDialog
          filmGroup={filmGroup}
          open={selectDialogOpen}
          onOpenChange={setSelectDialogOpen}
          onFilmSelected={handleFilmSelected}
        />

        {selectedFilm && (
          <ReduceCountDialog
            filmId={selectedFilm.id}
            filmName={selectedFilm.name}
            currentCount={selectedFilm.count || 0}
            onCountUpdated={handleGroupCountUpdated}
            open={reduceDialogOpen}
            onOpenChange={setReduceDialogOpen}
            trigger={<span style={{ display: "none" }} />}
          />
        )}
      </div>
    );
  }

  // Render for individual Film
  return (
    <div className="flex items-center gap-2">
      {filmData.is_bulk_film && (
        <SpoolBulkDialog
          filmId={filmData.id}
          filmName={filmData.name}
          format={filmData.format}
          remainingExposures={filmData.bulk_remaining_exposures || 0}
          spooledCassettes={filmData.spooled_cassettes || 0}
          onSpoolingComplete={handleSpoolingComplete}
        />
      )}
      <ReduceCountDialog
        filmId={filmData.id}
        filmName={filmData.name}
        currentCount={filmData.count || 0}
        onCountUpdated={handleCountUpdated}
      />
      <DropdownMenu open={dropdownOpen} onOpenChange={setDropdownOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem asChild>
            <Link href={`${prefix}/film/${filmData.id}`} className="flex items-center">
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setDropdownOpen(false);
              setEditDialogOpen(true);
            }}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setDropdownOpen(false);
              setHistoryDialogOpen(true);
            }}
          >
            <History className="mr-2 h-4 w-4" />
            History
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {editDialogOpen && (
        <EditFilm
          film={filmData}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          hideTrigger
        />
      )}
      {historyDialogOpen && (
        <UsageHistoryDialog
          filmId={filmData.id}
          filmName={filmData.name}
          currentCount={filmData.count}
          open={historyDialogOpen}
          onOpenChange={setHistoryDialogOpen}
          hideTrigger
        />
      )}
    </div>
  );
};

export const columns: ColumnDef<TableRow>[] = [
  {
    id: "expander",
    header: "",
    cell: ({ row, table }) => {
      const rowData: TableRow = row.original;
      if (isFilmGroup(rowData)) {
        const filmGroup = rowData;
        const toggleExpansion = (
          table.options.meta as { toggleExpansion?: (groupKey: string) => void }
        )?.toggleExpansion;

        return (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={() => toggleExpansion?.(filmGroup.groupKey)}
          >
            {filmGroup.isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        );
      }
      return null;
    },
  },
  {
    accessorKey: "name",
    header: "Name",
    filterFn: "includesString",
  },
  {
    accessorKey: "brand",
    header: "Brand",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      if (filterValue.not) {
        return !filterValue.not.includes(row.getValue(columnId));
      }
      if (Array.isArray(filterValue) && filterValue.length === 0) return true;
      return Array.isArray(filterValue)
        ? filterValue.includes(row.getValue(columnId))
        : true;
    },
  },
  {
    accessorKey: "iso",
    header: "ISO",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      if (filterValue.not) {
        return !filterValue.not.includes(row.getValue(columnId));
      }
      if (Array.isArray(filterValue) && filterValue.length === 0) return true;
      return Array.isArray(filterValue)
        ? filterValue.includes(row.getValue(columnId))
        : true;
    },
  },
  {
    accessorKey: "format",
    header: "Format",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      if (filterValue.not) {
        return !filterValue.not.includes(row.getValue(columnId));
      }
      if (Array.isArray(filterValue) && filterValue.length === 0) return true;
      return Array.isArray(filterValue)
        ? filterValue.includes(row.getValue(columnId))
        : true;
    },
  },
  {
    accessorKey: "type",
    header: "Type",
    filterFn: (row, columnId, filterValue) => {
      if (!filterValue) return true;
      if (filterValue.not) {
        return !filterValue.not.includes(row.getValue(columnId));
      }
      if (Array.isArray(filterValue) && filterValue.length === 0) return true;
      return Array.isArray(filterValue)
        ? filterValue.includes(row.getValue(columnId))
        : true;
    },
  },
  {
    accessorKey: "is_ecn",
    header: "ECN",
    cell: ({ row }) => {
      const film = row.original;
      return film.is_ecn ? (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          ECN
        </span>
      ) : null;
    },
    filterFn: (row, columnId, filterValue) => {
      if (filterValue === undefined || filterValue === "") return true;
      const isEcn = Boolean(row.getValue(columnId));
      return Boolean(filterValue) ? isEcn : !isEcn;
    },
  },
  {
    accessorKey: "expiration_date",
    header: "Expiration Date",
    cell: ({ row }) => formatDate(row.original.expiration_date),
    sortingFn: (rowA, rowB) => {
      return (
        new Date(rowA.original.expiration_date).getTime() -
        new Date(rowB.original.expiration_date).getTime()
      );
    },
  },
  {
    accessorKey: "count",
    header: "Bulk Status / Count",
    cell: ({ row }) => {
      const rowData: TableRow = row.original;

      // For FilmGroup, show total count
      if (isFilmGroup(rowData)) {
        return (
          <div className="text-center">
            <span className="font-medium">{rowData.count || 0}</span>
            <div className="text-xs text-muted-foreground">rolls</div>
          </div>
        );
      }

      const film = rowData as Film;
      if (film.is_bulk_film) {
        const remainingExposures = film.bulk_remaining_exposures || 0;
        const spooledCassettes = film.spooled_cassettes || 0;

        return (
          <div className="text-center space-y-0.5">
            <div className="text-sm">
              <span className="font-medium text-blue-600">
                {remainingExposures} exp
              </span>
              <div className="text-xs text-muted-foreground">remaining</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {spooledCassettes} cassettes ready
            </div>
          </div>
        );
      }
      return (
        <div className="text-center">
          <span className="font-medium">{film.count || 0}</span>
          <div className="text-xs text-muted-foreground">rolls</div>
        </div>
      );
    },
  },
  {
    accessorKey: "reserved_quantity",
    header: "Reserved",
    cell: ({ row }) => row.original.reserved_quantity || 0,
  },
  {
    accessorKey: "available_count",
    header: "Available for Shooting",
    cell: ({ row }) => {
      const rowData: TableRow = row.original;

      // For FilmGroup, show total available
      if (isFilmGroup(rowData)) {
        const available = rowData.available_count ?? 0;
        const isLow = available <= 2 && available > 0;
        const isEmpty = available === 0;

        return (
          <span
            className={`font-medium ${
              isEmpty
                ? "text-red-600"
                : isLow
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {available}
          </span>
        );
      }

      const film = rowData as Film;
      const available = film.available_count ?? 0;
      const isLow = available <= 2 && available > 0;
      const isEmpty = available === 0;

      return (
        <span
          className={`font-medium ${
            isEmpty
              ? "text-red-600"
              : isLow
              ? "text-yellow-600"
              : "text-green-600"
          }`}
        >
          {available}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => <ActionsCell row={row} />,
  },
];
