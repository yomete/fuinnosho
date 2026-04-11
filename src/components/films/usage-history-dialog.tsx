"use client";

import { useState, useEffect, useCallback } from "react";
import { getFilmUsageHistory } from "@/app/actions/films";
import type { FilmUsage } from "@/lib/films/types";
import { formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { History, Calendar, Package, Scissors, Camera } from "lucide-react";
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

  const loadUsageHistory = useCallback(async () => {
    setIsLoading(true);
    const result = await getFilmUsageHistory(filmId);
    if (result.data) {
      setUsageHistory(result.data);
    }
    setIsLoading(false);
  }, [filmId]);

  useEffect(() => {
    if (open) {
      loadUsageHistory();
    }
  }, [open, loadUsageHistory]);

  const totalUsed = usageHistory.reduce((sum, usage) => sum + usage.quantity, 0);
  const spooledCount = usageHistory.filter(u => u.usage_type === 'spool').reduce((sum, usage) => sum + usage.quantity, 0);
  const shotCount = usageHistory.filter(u => u.usage_type === 'shoot').reduce((sum, usage) => sum + usage.quantity, 0);

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
            <div className="flex gap-2 items-center mt-2 flex-wrap">
              <Badge variant="outline">
                <Package className="h-3 w-3 mr-1" />
                Current: {currentCount}
              </Badge>
              <Badge variant="secondary">
                Total Used: {totalUsed}
              </Badge>
              {spooledCount > 0 && (
                <Badge variant="outline" className="text-orange-600">
                  <Scissors className="h-3 w-3 mr-1" />
                  Spooled: {spooledCount}
                </Badge>
              )}
              {shotCount > 0 && (
                <Badge variant="outline" className="text-green-600">
                  <Camera className="h-3 w-3 mr-1" />
                  Shot: {shotCount}
                </Badge>
              )}
            </div>
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-y-auto flex-1 pr-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading usage history…
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
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          variant={usage.usage_type === 'spool' ? 'secondary' : 'default'} 
                          className={`text-xs ${usage.usage_type === 'spool' ? 'bg-orange-100 text-orange-800' : ''}`}
                        >
                          {usage.usage_type === 'spool' ? (
                            <Scissors className="h-3 w-3 mr-1" />
                          ) : (
                            <Camera className="h-3 w-3 mr-1" />
                          )}
                          {usage.usage_type === 'spool' ? 'Spooled' : 'Shot'} {usage.quantity} {usage.quantity === 1 ? "cassette" : "cassettes"}
                        </Badge>
                        {usage.exposures_used && (
                          <Badge variant="outline" className="text-xs">
                            {usage.exposures_used} exp used
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(usage.created_at)} at{" "}
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
