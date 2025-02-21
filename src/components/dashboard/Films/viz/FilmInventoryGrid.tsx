"use client";

import { Film } from "../utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Camera, Clock } from "lucide-react";

interface FilmInventoryGridProps {
  films: Film[];
}

export default function FilmInventoryGrid({ films }: FilmInventoryGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
      {films.map((film) => (
        <Card key={film.id} className="hover:shadow-lg transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div className="flex flex-col">
              <h3 className="font-bold text-lg">{film.name}</h3>
              <p className="text-sm text-muted-foreground">{film.brand}</p>
            </div>
            <Badge
              variant={film.type === "Black & White" ? "outline" : "default"}
            >
              {film.type}
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Camera className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {film.format} · ISO {film.iso}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Expires: {new Date(film.expiration_date).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  Added: {new Date(film.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
