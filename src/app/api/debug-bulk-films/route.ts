import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();

    // Get all bulk films with their current values
    const { data: bulkFilms, error: fetchError } = await supabase
      .from('films')
      .select('id, name, format, calculated_rolls, bulk_remaining_exposures, spooled_cassettes, is_bulk_film')
      .eq('is_bulk_film', true)
      .is('deleted_at', null)
      .order('name');

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      bulkFilms,
      count: bulkFilms.length
    });

  } catch (error) {
    console.error('Error fetching bulk films:', error);
    return NextResponse.json(
      { error: "Failed to fetch bulk films" },
      { status: 500 }
    );
  }
}