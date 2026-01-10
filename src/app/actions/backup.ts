'use server'

import { createClient } from '@/lib/supabase/server'

export interface BackupData {
  films: Record<string, unknown>[]
  film_usage: Record<string, unknown>[]
  gear: Record<string, unknown>[]
  trips: Record<string, unknown>[]
  trip_films: Record<string, unknown>[]
  trip_gear: Record<string, unknown>[]
  metadata: {
    exportedAt: string
    exportedBy: string
    totalRecords: number
  }
}

export async function generateFullBackup(): Promise<BackupData> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  console.log('🔄 Starting full backup for user:', user.id)

  // Fetch all user data in parallel
  const [
    films,
    filmUsage,
    gear,
    trips,
    tripFilms,
    tripGear
  ] = await Promise.all([
    // Films (including soft-deleted)
    supabase
      .from('films')
      .select('*')
      .eq('user_id', user.id),

    // Film Usage
    supabase
      .from('film_usage')
      .select(`
        *,
        films!inner(user_id)
      `)
      .eq('films.user_id', user.id),

    // Gear
    supabase
      .from('gear')
      .select('*')
      .eq('user_id', user.id),

    // Trips
    supabase
      .from('trips')
      .select('*')
      .eq('user_id', user.id),

    // Trip Films
    supabase
      .from('trip_films')
      .select(`
        *,
        trips!inner(user_id)
      `)
      .eq('trips.user_id', user.id),

    // Trip Gear
    supabase
      .from('trip_gear')
      .select(`
        *,
        trips!inner(user_id)
      `)
      .eq('trips.user_id', user.id)
  ])

  // Check for errors
  const errors = [
    films.error,
    filmUsage.error,
    gear.error,
    trips.error,
    tripFilms.error,
    tripGear.error
  ].filter(Boolean)

  if (errors.length > 0) {
    console.error('Backup errors:', errors)
    throw new Error(`Failed to backup data: ${errors[0]?.message}`)
  }

  // Calculate total records
  const totalRecords = [
    films.data?.length || 0,
    filmUsage.data?.length || 0,
    gear.data?.length || 0,
    trips.data?.length || 0,
    tripFilms.data?.length || 0,
    tripGear.data?.length || 0
  ].reduce((sum, count) => sum + count, 0)

  console.log('✅ Backup completed:', {
    films: films.data?.length || 0,
    film_usage: filmUsage.data?.length || 0,
    gear: gear.data?.length || 0,
    trips: trips.data?.length || 0,
    totalRecords
  })

  return {
    films: films.data || [],
    film_usage: filmUsage.data || [],
    gear: gear.data || [],
    trips: trips.data || [],
    trip_films: tripFilms.data || [],
    trip_gear: tripGear.data || [],
    metadata: {
      exportedAt: new Date().toISOString(),
      exportedBy: user.email || user.id,
      totalRecords
    }
  }
}

export async function generateTableBackup(tableName: string): Promise<Record<string, unknown>[]> {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  console.log(`🔄 Starting backup for table: ${tableName}`)

  let query
  switch (tableName) {
    case 'films':
      query = supabase.from('films').select('*').eq('user_id', user.id)
      break
    case 'film_usage':
      query = supabase.from('film_usage').select('*, films!inner(user_id)').eq('films.user_id', user.id)
      break
    case 'gear':
      query = supabase.from('gear').select('*').eq('user_id', user.id)
      break
    case 'trips':
      query = supabase.from('trips').select('*').eq('user_id', user.id)
      break
    case 'trip_films':
      query = supabase.from('trip_films').select('*, trips!inner(user_id)').eq('trips.user_id', user.id)
      break
    case 'trip_gear':
      query = supabase.from('trip_gear').select('*, trips!inner(user_id)').eq('trips.user_id', user.id)
      break
    default:
      throw new Error(`Unknown table: ${tableName}`)
  }

  const { data, error } = await query

  if (error) {
    console.error(`Error backing up ${tableName}:`, error)
    throw new Error(`Failed to backup ${tableName}: ${error.message}`)
  }

  console.log(`✅ Backed up ${data?.length || 0} records from ${tableName}`)
  return data || []
}

export async function getBackupStats() {
  const supabase = await createClient()

  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }

  // Get count of records in each table
  const [
    filmsCount,
    filmUsageCount,
    gearCount,
    tripsCount,
    tripFilmsCount,
    tripGearCount
  ] = await Promise.all([
    supabase.from('films').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('film_usage').select('*, films!inner(user_id)', { count: 'exact', head: true }).eq('films.user_id', user.id),
    supabase.from('gear').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('trips').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
    supabase.from('trip_films').select('*, trips!inner(user_id)', { count: 'exact', head: true }).eq('trips.user_id', user.id),
    supabase.from('trip_gear').select('*, trips!inner(user_id)', { count: 'exact', head: true }).eq('trips.user_id', user.id)
  ])

  return {
    films: filmsCount.count || 0,
    film_usage: filmUsageCount.count || 0,
    gear: gearCount.count || 0,
    trips: tripsCount.count || 0,
    trip_films: tripFilmsCount.count || 0,
    trip_gear: tripGearCount.count || 0,
    total: [
      filmsCount.count,
      filmUsageCount.count,
      gearCount.count,
      tripsCount.count,
      tripFilmsCount.count,
      tripGearCount.count
    ].reduce((sum: number, count) => sum + (count || 0), 0)
  }
}
