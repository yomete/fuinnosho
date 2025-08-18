'use server'

import { createClient } from '@/lib/supabase/server'
import { type Challenge, type ChallengePrompt, type ChallengeProgress, type ChallengeFilmRoll } from '@/lib/utils'

export async function getChallenges(): Promise<Challenge[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching challenges:', error)
    throw new Error('Failed to fetch challenges')
  }
  
  return data || []
}

export async function getChallenge(challengeId: string): Promise<Challenge | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('id', challengeId)
    .single()
  
  if (error) {
    console.error('Error fetching challenge:', error)
    return null
  }
  
  return data
}

export async function getChallengePrompts(challengeId: string): Promise<ChallengePrompt[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('challenge_prompts')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('day_number', { ascending: true })
  
  if (error) {
    console.error('Error fetching challenge prompts:', error)
    throw new Error('Failed to fetch challenge prompts')
  }
  
  return data || []
}

export async function getChallengeProgress(challengeId: string): Promise<ChallengeProgress[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('challenge_progress')
    .select('*')
    .eq('challenge_id', challengeId)
    .order('created_at', { ascending: true })
  
  if (error) {
    console.error('Error fetching challenge progress:', error)
    throw new Error('Failed to fetch challenge progress')
  }
  
  return data || []
}

export async function updateChallengeProgress(
  promptId: string,
  updates: Partial<ChallengeProgress>
): Promise<void> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }
  
  // Get the prompt to find challenge_id
  const { data: prompt } = await supabase
    .from('challenge_prompts')
    .select('challenge_id')
    .eq('id', promptId)
    .single()
  
  if (!prompt) {
    throw new Error('Prompt not found')
  }
  
  const { error } = await supabase
    .from('challenge_progress')
    .upsert({
      prompt_id: promptId,
      user_id: user.id,
      challenge_id: prompt.challenge_id,
      ...updates,
      updated_at: new Date().toISOString(),
    })
  
  if (error) {
    console.error('Error updating challenge progress:', error)
    throw new Error('Failed to update challenge progress')
  }
}

export async function getChallengeFilmRolls(challengeId: string): Promise<ChallengeFilmRoll[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('challenge_film_rolls')
    .select(`
      *,
      films (
        name,
        brand,
        type,
        iso
      )
    `)
    .eq('challenge_id', challengeId)
    .order('roll_number', { ascending: true })
  
  if (error) {
    console.error('Error fetching challenge film rolls:', error)
    throw new Error('Failed to fetch challenge film rolls')
  }
  
  return data || []
}

export async function getCurrentDay(challenge: Challenge): Promise<number> {
  const today = new Date()
  const startDate = new Date(challenge.start_date)
  const diffTime = today.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1
  
  // Clamp between 1 and total_days
  return Math.max(1, Math.min(diffDays, challenge.total_days))
}

export async function getTodaysPrompt(challengeId: string): Promise<ChallengePrompt | null> {
  const challenge = await getChallenge(challengeId)
  if (!challenge) return null
  
  const currentDay = await getCurrentDay(challenge)
  
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('challenge_prompts')
    .select('*')
    .eq('challenge_id', challengeId)
    .eq('day_number', currentDay)
    .single()
  
  if (error) {
    console.error('Error fetching today\'s prompt:', error)
    return null
  }
  
  return data
}

export async function createChallenge(challengeData: {
  name: string
  description?: string
  start_date: string
  end_date: string
  total_days: number
}): Promise<string> {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) {
    throw new Error('User not authenticated')
  }
  
  const { data, error } = await supabase
    .from('challenges')
    .insert([{
      ...challengeData,
      user_id: user.id
    }])
    .select('id')
    .single()
  
  if (error) {
    console.error('Error creating challenge:', error)
    throw new Error('Failed to create challenge')
  }
  
  return data.id
}

export async function createChallengePrompts(prompts: Omit<ChallengePrompt, 'id' | 'created_at'>[]): Promise<void> {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('challenge_prompts')
    .insert(prompts)
  
  if (error) {
    console.error('Error creating challenge prompts:', error)
    throw new Error('Failed to create challenge prompts')
  }
}
