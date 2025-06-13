import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useBrands() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("films")
        .select("brand")
        .order("brand");

      if (error) {
        console.error("Error fetching brands:", error);
        return [];
      }

      // Extract unique brands
      const uniqueBrands = Array.from(
        new Set(data?.map((film) => film.brand) || [])
      ).filter(Boolean).sort();

      return uniqueBrands;
    },
  });
}