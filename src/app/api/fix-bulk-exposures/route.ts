import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // Get all bulk films
    const { data: bulkFilms, error: fetchError } = await supabase
      .from('films')
      .select('id, name, format, calculated_rolls, bulk_remaining_exposures, spooled_cassettes')
      .eq('is_bulk_film', true)
      .is('deleted_at', null);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    const results = [];

    for (const film of bulkFilms) {
      // Only update if bulk_remaining_exposures is null/undefined
      if (film.bulk_remaining_exposures === null || film.bulk_remaining_exposures === undefined) {
        // Calculate exposures based on format and calculated_rolls
        let exposuresPerRoll;
        if (film.format === '35mm') {
          exposuresPerRoll = 36;
        } else if (film.format === '120') {
          exposuresPerRoll = 12;
        } else {
          exposuresPerRoll = 36; // default
        }

        const totalExposures = (film.calculated_rolls || 0) * exposuresPerRoll;

        const { error: updateError } = await supabase
          .from('films')
          .update({ 
            bulk_remaining_exposures: totalExposures,
            spooled_cassettes: film.spooled_cassettes || 0
          })
          .eq('id', film.id);

        if (updateError) {
          results.push({ film: film.name, error: updateError.message });
        } else {
          results.push({ 
            film: film.name, 
            updated: true, 
            exposures: totalExposures,
            calculation: `${film.calculated_rolls} rolls × ${exposuresPerRoll} exposures`
          });
        }
      } else {
        results.push({ 
          film: film.name, 
          skipped: true, 
          reason: `Already has ${film.bulk_remaining_exposures} exposures` 
        });
      }
    }

    return NextResponse.json({ 
      message: "Bulk film exposures update completed",
      results 
    });

  } catch (error) {
    console.error('Error fixing bulk exposures:', error);
    return NextResponse.json(
      { error: "Failed to fix bulk exposures" },
      { status: 500 }
    );
  }
}