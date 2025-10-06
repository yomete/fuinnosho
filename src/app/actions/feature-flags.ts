"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export interface FeatureFlag {
  id: string;
  user_id: string;
  flag_name: string;
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export async function getFeatureFlag(flagName: string): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return false;
    }

    const { data, error } = await supabase
      .from("feature_flags")
      .select("enabled")
      .eq("user_id", user.id)
      .eq("flag_name", flagName)
      .single();

    if (error || !data) {
      return false;
    }

    return data.enabled;
  } catch {
    return false;
  }
}

export async function getAllFeatureFlags(): Promise<FeatureFlag[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return [];
    }

    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .eq("user_id", user.id)
      .order("flag_name");

    if (error || !data) {
      return [];
    }

    return data;
  } catch {
    return [];
  }
}

export async function toggleFeatureFlag(
  flagName: string,
  enabled: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: "Not authenticated" };
    }

    // Try to update first
    const { data: existing } = await supabase
      .from("feature_flags")
      .select("id")
      .eq("user_id", user.id)
      .eq("flag_name", flagName)
      .single();

    if (existing) {
      // Update existing flag
      const { error } = await supabase
        .from("feature_flags")
        .update({ enabled, updated_at: new Date().toISOString() })
        .eq("id", existing.id);

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Insert new flag
      const { error } = await supabase
        .from("feature_flags")
        .insert({
          user_id: user.id,
          flag_name: flagName,
          enabled,
        });

      if (error) {
        return { success: false, error: error.message };
      }
    }

    revalidatePath("/admin");
    revalidatePath("/chemistry");
    revalidatePath("/develop");

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to toggle feature flag",
    };
  }
}
