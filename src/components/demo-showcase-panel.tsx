"use client";

import { useState } from "react";
import Link from "next/link";
import { Film, MapPin, Camera, ArrowRight, Info } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DemoFilmsContent } from "./demo-films-content";
import { DemoTripsContent } from "./demo-trips-content";
import { DemoGearContent } from "./demo-gear-content";

interface DemoShowcasePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DemoShowcasePanel({
  open,
  onOpenChange,
}: DemoShowcasePanelProps) {
  const [activeTab, setActiveTab] = useState("films");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex flex-col">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-2xl">Try the Demo</SheetTitle>
          <SheetDescription>
            Explore all features with sample data
          </SheetDescription>
        </SheetHeader>

        {/* Demo notice */}
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mb-4">
          <Info className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-500/90">
            This is a preview with sample data. Sign up to create your own
            inventory.
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col"
        >
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="films" className="flex items-center gap-1.5">
              <Film className="w-3.5 h-3.5" />
              <span>Films</span>
            </TabsTrigger>
            <TabsTrigger value="trips" className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Trips</span>
            </TabsTrigger>
            <TabsTrigger value="gear" className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              <span>Gear</span>
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="films" className="mt-0 h-full">
              <DemoFilmsContent />
            </TabsContent>
            <TabsContent value="trips" className="mt-0 h-full">
              <DemoTripsContent />
            </TabsContent>
            <TabsContent value="gear" className="mt-0 h-full">
              <DemoGearContent />
            </TabsContent>
          </div>
        </Tabs>

        {/* Footer CTA */}
        <div className="mt-6 pt-4 border-t border-[#2a2420] space-y-3">
          <Link
            href="/register"
            className="group flex items-center justify-center gap-2 w-full px-4 py-3 bg-amber-500 hover:bg-amber-400 text-[#0d0b0a] rounded-lg font-medium transition-colors"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <p className="text-center text-xs text-[#6a6460]">
            No credit card required
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
