"use client";

import { useEffect, useState } from "react";
import { Camera, Circle } from "lucide-react";
import { seedGear } from "@/lib/seed-data";

interface GearData {
  id: string;
  name: string;
  brand: string;
  type: "camera" | "lens" | "flash" | "accessory" | "tripod" | "filter" | "bag";
  model?: string;
  condition: "excellent" | "good" | "fair" | "poor";
  camera_id?: string;
}

export function DemoGearContent() {
  const [gear, setGear] = useState<GearData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use seed data directly for the demo panel
    setGear(seedGear as GearData[]);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500" />
      </div>
    );
  }

  const cameras = gear.filter((g) => g.type === "camera");
  const lenses = gear.filter((g) => g.type === "lens");
  const accessories = gear.filter(
    (g) => !["camera", "lens"].includes(g.type)
  );

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Cameras" value={cameras.length} />
        <StatCard label="Lenses" value={lenses.length} />
        <StatCard label="Other" value={accessories.length} />
      </div>

      {/* Gear List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
        {gear.map((item) => (
          <GearCard key={item.id} gear={item} />
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="p-3 rounded-lg bg-[#1a1614] border border-[#2a2420]">
      <div className="text-xl text-[#e8e4e0] font-light">{value}</div>
      <div className="text-xs text-[#6a6460]">{label}</div>
    </div>
  );
}

function GearCard({ gear }: { gear: GearData }) {
  const typeIcons: Record<string, string> = {
    camera: "bg-sky-500/20 text-sky-500",
    lens: "bg-violet-500/20 text-violet-500",
    flash: "bg-amber-500/20 text-amber-500",
    accessory: "bg-emerald-500/20 text-emerald-500",
    tripod: "bg-zinc-500/20 text-zinc-400",
    filter: "bg-rose-500/20 text-rose-500",
    bag: "bg-orange-500/20 text-orange-500",
  };

  const conditionColors: Record<string, string> = {
    excellent: "text-emerald-500",
    good: "text-sky-500",
    fair: "text-amber-500",
    poor: "text-red-500",
  };

  return (
    <div className="p-3 rounded-lg bg-gradient-to-br from-sky-500/5 to-sky-600/5 border border-[#2a2420] hover:border-[#3a3430] transition-colors">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            className={`w-6 h-6 rounded flex items-center justify-center ${typeIcons[gear.type]}`}
          >
            {gear.type === "camera" ? (
              <Camera className="w-3 h-3" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
          </div>
          <span
            className="text-[#e8e4e0] text-sm"
            style={{ fontFamily: "Georgia, serif" }}
          >
            {gear.name}
          </span>
        </div>
        <span className={`text-xs capitalize ${conditionColors[gear.condition]}`}>
          {gear.condition}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs pl-8">
        <span className="text-[#6a6460]">
          {gear.brand}
          {gear.model && ` · ${gear.model}`}
        </span>
        <span className="text-[#8a8078] capitalize">{gear.type}</span>
      </div>
    </div>
  );
}
