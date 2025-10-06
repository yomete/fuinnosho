"use server";

import {
  ChemistryInventory,
  ChemistryInventorySchema,
  chemistryInventorySchema,
  DevelopmentRecipe,
  DevelopmentRecipeSchema,
  developmentRecipeSchema,
} from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import { v4 as uuidv4 } from "uuid";
import { revalidatePath } from "next/cache";

interface CreateChemistryResponse {
  success: boolean;
  error?: string;
  chemistry?: ChemistryInventory;
}

interface CreateRecipeResponse {
  success: boolean;
  error?: string;
  recipe?: DevelopmentRecipe;
}

// Chemistry Inventory CRUD operations
export async function getChemistryInventory(
  processType?: 'black_white' | 'color'
): Promise<{
  data: ChemistryInventory[] | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from("chemistry_inventory")
      .select("*")
      .order("created_at", { ascending: false });

    if (processType) {
      query = query.eq("process_type", processType);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching chemistry inventory:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Failed to fetch chemistry inventory"),
    };
  }
}

export async function getChemistryById(
  id: string
): Promise<{
  data: ChemistryInventory | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("chemistry_inventory")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching chemistry:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Failed to fetch chemistry"),
    };
  }
}

export async function createChemistry(
  data: ChemistryInventorySchema
): Promise<CreateChemistryResponse> {
  try {
    const validatedData = chemistryInventorySchema.parse(data);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const chemistryId = uuidv4();
    const newChemistry: Omit<ChemistryInventory, 'updated_at'> = {
      ...validatedData,
      id: chemistryId,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("chemistry_inventory")
      .insert([newChemistry]);

    if (error) {
      throw error;
    }

    revalidatePath("/chemistry");
    return { success: true, chemistry: { ...newChemistry, updated_at: newChemistry.created_at } };
  } catch (error) {
    console.error("Error creating chemistry:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create chemistry",
    };
  }
}

export async function editChemistry(
  id: string,
  data: ChemistryInventorySchema
): Promise<CreateChemistryResponse> {
  try {
    const validatedData = chemistryInventorySchema.parse(data);

    const supabase = await createClient();
    const { error } = await supabase
      .from("chemistry_inventory")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    const { data: updatedChemistry } = await supabase
      .from("chemistry_inventory")
      .select("*")
      .eq("id", id)
      .single();

    revalidatePath("/chemistry");
    return { success: true, chemistry: updatedChemistry };
  } catch (error) {
    console.error("Error editing chemistry:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to edit chemistry",
    };
  }
}

export async function deleteChemistry(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("chemistry_inventory")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    revalidatePath("/chemistry");
    return { success: true };
  } catch (error) {
    console.error("Error deleting chemistry:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete chemistry",
    };
  }
}

export async function markChemistryAsOpened(
  id: string,
  openedDate?: string
): Promise<CreateChemistryResponse> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("chemistry_inventory")
      .update({
        opened_date: openedDate || new Date().toISOString().split('T')[0],
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    const { data: updatedChemistry } = await supabase
      .from("chemistry_inventory")
      .select("*")
      .eq("id", id)
      .single();

    revalidatePath("/chemistry");
    return { success: true, chemistry: updatedChemistry };
  } catch (error) {
    console.error("Error marking chemistry as opened:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to mark chemistry as opened",
    };
  }
}

// Development Recipe CRUD operations
export async function getRecipes(): Promise<{
  data: (DevelopmentRecipe & { developer?: ChemistryInventory })[] | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("development_recipes")
      .select(`
        *,
        developer:chemistry_inventory(*)
      `)
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching recipes:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Failed to fetch recipes"),
    };
  }
}

export async function getRecipeById(
  id: string
): Promise<{
  data: (DevelopmentRecipe & { developer?: ChemistryInventory }) | null;
  error: Error | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("development_recipes")
      .select(`
        *,
        developer:chemistry_inventory(*)
      `)
      .eq("id", id)
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error fetching recipe:", error);
    return {
      data: null,
      error: error instanceof Error ? error : new Error("Failed to fetch recipe"),
    };
  }
}

export async function createRecipe(
  data: DevelopmentRecipeSchema
): Promise<CreateRecipeResponse> {
  try {
    const validatedData = developmentRecipeSchema.parse(data);

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("User not authenticated");
    }

    const recipeId = uuidv4();
    const newRecipe: Omit<DevelopmentRecipe, 'updated_at' | 'developer'> = {
      ...validatedData,
      id: recipeId,
      user_id: user.id,
      created_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("development_recipes")
      .insert([newRecipe]);

    if (error) {
      throw error;
    }

    revalidatePath("/chemistry/recipes");
    return { success: true, recipe: { ...newRecipe, updated_at: newRecipe.created_at } };
  } catch (error) {
    console.error("Error creating recipe:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create recipe",
    };
  }
}

export async function editRecipe(
  id: string,
  data: DevelopmentRecipeSchema
): Promise<CreateRecipeResponse> {
  try {
    const validatedData = developmentRecipeSchema.parse(data);

    const supabase = await createClient();
    const { error } = await supabase
      .from("development_recipes")
      .update({
        ...validatedData,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      throw error;
    }

    const { data: updatedRecipe } = await supabase
      .from("development_recipes")
      .select("*")
      .eq("id", id)
      .single();

    revalidatePath("/chemistry/recipes");
    return { success: true, recipe: updatedRecipe };
  } catch (error) {
    console.error("Error editing recipe:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to edit recipe",
    };
  }
}

export async function deleteRecipe(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from("development_recipes")
      .delete()
      .eq("id", id);

    if (error) {
      throw error;
    }

    revalidatePath("/chemistry/recipes");
    return { success: true };
  } catch (error) {
    console.error("Error deleting recipe:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete recipe",
    };
  }
}
