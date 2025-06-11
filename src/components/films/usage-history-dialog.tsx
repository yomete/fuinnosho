"use client";

import { useState, useEffect } from "react";
import { getFilmUsageHistory } from "@/app/actions/films";
import { FilmUsage } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { History, Calendar, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface UsageHistoryDialogProps {
  filmId: string;
  filmName: string;
  currentCount?: number;
}

export function UsageHistoryDialog({
  filmId,
  filmName,
  currentCount = 0,
}: UsageHistoryDialogProps) {
  const [open, setOpen] = useState(false);
  const [usageHistory, setUsageHistory] = useState<FilmUsage[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadUsageHistory();
    }
  }, [open, filmId]);

  const loadUsageHistory = async () => {
    setIsLoading(true);
    const result = await getFilmUsageHistory(filmId);
    if (result.data) {
      setUsageHistory(result.data);
    }
    setIsLoading(false);
  };

  const totalUsed = usageHistory.reduce((sum, usage) => sum + usage.quantity, 0);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <History className="h-4 w-4 mr-1" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Usage History for {filmName}</DialogTitle>
          <DialogDescription>
            <div className="flex gap-4 items-center mt-2">
              <Badge variant="outline">
                <Package className="h-3 w-3 mr-1" />
                Current: {currentCount}
              </Badge>
              <Badge variant="secondary">
                Total Used: {totalUsed}
              </Badge>
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading usage history...
            </div>
          ) : usageHistory.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No usage recorded yet
            </div>
          ) : (
            <div className="space-y-3">
              {usageHistory.map((usage) => (
                <div
                  key={usage.id}
                  className="border rounded-lg p-4 space-y-2"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="default" className="text-xs">
                          {usage.quantity} {usage.quantity === 1 ? "roll" : "rolls"}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(usage.created_at).toLocaleDateString()} at{" "}
                          {new Date(usage.created_at).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="text-sm">{usage.usage_note}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}