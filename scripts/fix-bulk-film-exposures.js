// Script to fix bulk_remaining_exposures for existing bulk films
// Run this with: node scripts/fix-bulk-film-exposures.js

const { createClient } = require('@supabase/supabase-js');

async function fixBulkFilmExposures() {
  // You'll need to set your Supabase URL and key
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get all bulk films that don't have bulk_remaining_exposures set
    const { data: bulkFilms, error: fetchError } = await supabase
      .from('films')
      .select('id, name, format, calculated_rolls, bulk_remaining_exposures')
      .eq('is_bulk_film', true);

    if (fetchError) {
      console.error('Error fetching bulk films:', fetchError);
      return;
    }

    console.log(`Found ${bulkFilms.length} bulk films`);

    for (const film of bulkFilms) {
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

        console.log(`Updating ${film.name}: ${totalExposures} exposures (${film.calculated_rolls} rolls × ${exposuresPerRoll})`);

        const { error: updateError } = await supabase
          .from('films')
          .update({ 
            bulk_remaining_exposures: totalExposures,
            spooled_cassettes: 0 // Initialize if not set
          })
          .eq('id', film.id);

        if (updateError) {
          console.error(`Error updating ${film.name}:`, updateError);
        } else {
          console.log(`✓ Updated ${film.name}`);
        }
      } else {
        console.log(`${film.name} already has bulk_remaining_exposures: ${film.bulk_remaining_exposures}`);
      }
    }

    console.log('Done!');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixBulkFilmExposures();