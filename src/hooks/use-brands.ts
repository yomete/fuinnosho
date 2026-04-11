import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useBrands() {
  const [brands, setBrands] = useState<string[]>([]);

  useEffect(() => {
    const supabase = createClient();

    let isMounted = true;

    async function loadBrands() {
      const { data, error } = await supabase
        .from("films")
        .select("brand")
        .is("deleted_at", null)
        .order("brand");

      if (error) {
        console.error("Error fetching brands:", error);
        return;
      }

      const uniqueBrands = Array.from(
        new Set(data?.map((film) => film.brand) || [])
      )
        .filter(Boolean)
        .sort();

      if (isMounted) {
        setBrands(uniqueBrands);
      }
    }

    void loadBrands();

    return () => {
      isMounted = false;
    };
  }, []);

  return brands;
}
