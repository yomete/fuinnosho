"use client";

import { useState, useEffect, useCallback } from "react";
import { Film } from "@/lib/utils";
import { getDeletedFilms } from "@/app/actions/films";
import { DeletedFilmsTable } from "./deleted-films-table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, Trash2 } from "lucide-react";

export function DeletedFilmsSection() {
  const [isOpen, setIsOpen] = useState(false);
  const [deletedFilms, setDeletedFilms] = useState<Film[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDeletedFilms = useCallback(async () => {
    setIsLoading(true);
    const { data } = await getDeletedFilms();
    setDeletedFilms(data || []);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (isOpen && deletedFilms.length === 0) {
      loadDeletedFilms();
    }
  }, [isOpen, deletedFilms.length, loadDeletedFilms]);

  const handleUpdate = () => {
    loadDeletedFilms();
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="px-2 sm:px-0">
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between text-[#8a8078] hover:text-[#e8e4e0] hover:bg-[#2a2420]/50 py-3"
        >
          <span className="flex items-center gap-2">
            <Trash2 className="h-4 w-4" />
            Deleted Films
            {deletedFilms.length > 0 && (
              <span className="text-xs bg-[#2a2420] px-2 py-0.5 rounded">
                {deletedFilms.length}
              </span>
            )}
          </span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-2">
        <div className="rounded-lg border border-[#2a2420] bg-[#1a1614] p-4">
          {isLoading ? (
            <div className="text-center py-4 text-[#8a8078]">Loading...</div>
          ) : (
            <DeletedFilmsTable films={deletedFilms} onUpdate={handleUpdate} />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
