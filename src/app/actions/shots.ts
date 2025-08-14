'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Define the type for a single shot based on the database schema
export type Shot = {
  id?: string; // UUID, optional for new shots
  user_id: string;
  trip_film_id: string;
  gear_id?: string | null;
  frame_number: number;
  aperture?: string | null;
  shutter_speed?: string | null;
  notes?: string | null;
  created_at?: string; // timestamptz
};

// Action to get all shots for a specific film on a trip
export async function getShotsForTripFilm(tripFilmId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('shots')
    .select('*')
    .eq('trip_film_id', tripFilmId)
    .order('frame_number', { ascending: true });

  if (error) {
    console.error('Error fetching shots:', error);
    throw new Error('Could not fetch shots.');
  }

  return data;
}

// Action to create or update a shot (upsert)
export async function createOrUpdateShot(shotData: Omit<Shot, 'user_id' | 'id' | 'created_at'>) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('User not authenticated');
  }

  const dataToUpsert = {
    ...shotData,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('shots')
    .upsert(dataToUpsert, { onConflict: 'unique_shot_frame' })
    .select()
    .single();

  if (error) {
    console.error('Error upserting shot:', error);
    throw new Error('Could not save shot data.');
  }

  // Revalidate the trip page to show updated shot info
  revalidatePath(`/trips`);

  return data;
}

// Action to delete a shot
export async function deleteShot(shotId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('shots')
    .delete()
    .eq('id', shotId);

  if (error) {
    console.error('Error deleting shot:', error);
    throw new Error('Could not delete shot.');
  }

  revalidatePath(`/trips`);
}