"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toggleFeatureFlag } from "@/app/actions/feature-flags";
import { toast } from "sonner";

interface FeatureFlagsProps {
  colorDevelopmentEnabled: boolean;
}

export function FeatureFlags({ colorDevelopmentEnabled }: FeatureFlagsProps) {
  const [isColorEnabled, setIsColorEnabled] = useState(colorDevelopmentEnabled);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleToggle = async (enabled: boolean) => {
    setIsUpdating(true);
    try {
      const result = await toggleFeatureFlag("color_development", enabled);

      if (result.success) {
        setIsColorEnabled(enabled);
        toast.success(
          enabled
            ? "Color development enabled"
            : "Color development disabled"
        );
      } else {
        toast.error(result.error || "Failed to update feature flag");
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>
          Enable or disable experimental features
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="color-development" className="flex flex-col space-y-1">
            <span className="font-medium">Color Film Development</span>
            <span className="text-sm text-muted-foreground font-normal">
              Enable color film development workflow (chemistry inventory and development sessions)
            </span>
          </Label>
          <Switch
            id="color-development"
            checked={isColorEnabled}
            onCheckedChange={handleToggle}
            disabled={isUpdating}
          />
        </div>
      </CardContent>
    </Card>
  );
}
