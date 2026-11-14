import { supabase } from './supabase'
import type { Reading } from '../content'

export const isSupabaseConfigured: boolean = !!supabase

// Local storage keys
const LS_PROFILE = 'astra_profile'
const LS_STATS = 'astra_stats'
const LS_READINGS = 'astra_readings'

// Types
export interface ProfileData {
  id: string
  player_name: string
  player_role: string
  callsign?: string
  created_at?: string
  updated_at?: string
}

export interface StatsData {
  id: string
  player_id: string
  total_xp: number
  total_checkins: number
  current_streak: number
  longest_streak: number
  last_checkin_date?: string
  unlocked_badges: string[]
  created_at?: string
  updated_at?: string
}

export interface HealthReading {
  id?: string
  player_id: string
  indicator_id: string
  value: number
  notes?: string
  created_at?: string
}

// Default values
const defaultProfile: ProfileData = {
  id: '',
  player_name: 'Commander',
  player_role: 'Mission Specialist',
  callsign: 'AUSTRALIS-4',
}

const defaultStats: StatsData = {
  id: '',
  player_id: '',
  total_xp: 0,
  total_checkins: 0,
  current_streak: 0,
  longest_streak: 0,
  last_checkin_date: undefined,
  unlocked_badges: [],
}

// Get profile from localStorage or Supabase
export async function getProfile(): Promise<ProfileData> {
  // Try localStorage first
  const saved = localStorage.getItem(LS_PROFILE)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      localStorage.removeItem(LS_PROFILE)
    }
  }

  // Try Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .limit(1)
        .single()

      if (!error && data) {
        const profile: ProfileData = {
          id: data.id,
          player_name: data.player_name,
          player_role: data.player_role,
          callsign: data.callsign,
          created_at: data.created_at,
          updated_at: data.updated_at,
        }
        localStorage.setItem(LS_PROFILE, JSON.stringify(profile))
        return profile
      }
    } catch (err) {
      console.error('Supabase profile fetch error:', err)
    }
  }

  return defaultProfile
}

// Save profile to localStorage and Supabase
export async function saveProfile(profile: Partial<ProfileData>): Promise<ProfileData> {
  const current = await getProfile()
  const updated: ProfileData = { ...current, ...profile }

  // Save to localStorage
  localStorage.setItem(LS_PROFILE, JSON.stringify(updated))

  // Save to Supabase if configured
  if (isSupabaseConfigured && supabase && updated.id) {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          player_name: updated.player_name,
          player_role: updated.player_role,
          callsign: updated.callsign,
        })
        .eq('id', updated.id)

      if (error) console.error('Supabase profile update error:', error)
    } catch (err) {
      console.error('Supabase profile save error:', err)
    }
  }

  return updated
}

// Get player stats from localStorage or Supabase
export async function getStats(playerId: string): Promise<StatsData> {
  // Try localStorage first
  const saved = localStorage.getItem(LS_STATS)
  if (saved) {
    try {
      const stats: StatsData = JSON.parse(saved)
      if (stats.player_id === playerId) {
        return stats
      }
    } catch {
      localStorage.removeItem(LS_STATS)
    }
  }

  // Try Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select('*')
        .eq('player_id', playerId)
        .single()

      if (!error && data) {
        const stats: StatsData = {
          id: data.id,
          player_id: data.player_id,
          total_xp: data.total_xp,
          total_checkins: data.total_checkins,
          current_streak: data.current_streak,
          longest_streak: data.longest_streak,
          last_checkin_date: data.last_checkin_date,
          unlocked_badges: data.unlocked_badges || [],
          created_at: data.created_at,
          updated_at: data.updated_at,
        }
        localStorage.setItem(LS_STATS, JSON.stringify(stats))
        return stats
      }
    } catch (err) {
      console.error('Supabase stats fetch error:', err)
    }
  }

  return defaultStats
}

// Save player stats to localStorage and Supabase
export async function saveStats(stats: StatsData): Promise<StatsData> {
  // Save to localStorage
  localStorage.setItem(LS_STATS, JSON.stringify(stats))

  // Save to Supabase if configured
  if (isSupabaseConfigured && supabase && stats.id) {
    try {
      const { error } = await supabase
        .from('player_stats')
        .update({
          total_xp: stats.total_xp,
          total_checkins: stats.total_checkins,
          current_streak: stats.current_streak,
          longest_streak: stats.longest_streak,
          last_checkin_date: stats.last_checkin_date,
          unlocked_badges: stats.unlocked_badges,
        })
        .eq('id', stats.id)

      if (error) console.error('Supabase stats update error:', error)
    } catch (err) {
      console.error('Supabase stats save error:', err)
    }
  }

  return stats
}

// Get health readings for an indicator
export async function getReadings(playerId: string, indicatorId: string): Promise<Reading[]> {
  // Try localStorage first
  const saved = localStorage.getItem(LS_READINGS)
  if (saved) {
    try {
      const allReadings: Record<string, Reading[]> = JSON.parse(saved)
      if (allReadings[indicatorId]) {
        return allReadings[indicatorId]
      }
    } catch {
      localStorage.removeItem(LS_READINGS)
    }
  }

  // Try Supabase
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('health_readings')
        .select('id, indicator_id, value, notes, created_at')
        .eq('player_id', playerId)
        .eq('indicator_id', indicatorId)
        .order('created_at', { ascending: false })
        .limit(70)

      if (!error && data) {
        const readings: Reading[] = data.map(r => ({
          indicatorId: r.indicator_id,
          value: parseFloat(r.value),
          timestamp: new Date(r.created_at!).getTime(),
          notes: r.notes,
        }))

        // Update localStorage with fresh data
        const current: Record<string, Reading[]> = {}
        const raw = localStorage.getItem(LS_READINGS)
        if (raw) {
          try {
            Object.assign(current, JSON.parse(raw))
          } catch {}
        }
        current[indicatorId] = readings
        localStorage.setItem(LS_READINGS, JSON.stringify(current))

        return readings
      }
    } catch (err) {
      console.error('Supabase readings fetch error:', err)
    }
  }

  return []
}

// Get all readings from localStorage
export function getAllLocalReadings(): Record<string, Reading[]> {
  const saved = localStorage.getItem(LS_READINGS)
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      localStorage.removeItem(LS_READINGS)
    }
  }
  return {}
}

// Save a single reading
export async function saveReading(
  playerId: string,
  reading: Reading
): Promise<Reading> {
  // Save to localStorage first
  const current: Record<string, Reading[]> = getAllLocalReadings()
  if (!current[reading.indicatorId]) {
    current[reading.indicatorId] = []
  }
  current[reading.indicatorId].unshift(reading)
  // Keep only last 70 readings
  if (current[reading.indicatorId].length > 70) {
    current[reading.indicatorId] = current[reading.indicatorId].slice(0, 70)
  }
  localStorage.setItem(LS_READINGS, JSON.stringify(current))

  // Save to Supabase if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('health_readings')
        .insert({
          player_id: playerId,
          indicator_id: reading.indicatorId,
          value: reading.value,
          notes: reading.notes,
        })

      if (error) console.error('Supabase reading insert error:', error)
    } catch (err) {
      console.error('Supabase reading save error:', err)
    }
  }

  return reading
}

// Initialize player data (create profile and stats if needed)
export async function initializePlayer(): Promise<{
  profile: ProfileData
  stats: StatsData
  playerId: string
}> {
  // Get or create profile
  let profile = await getProfile()
  
  if (!profile.id) {
    // Create new profile in Supabase
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .insert({
            player_name: profile.player_name,
            player_role: profile.player_role,
            callsign: profile.callsign,
          })
          .select()
          .single()

        if (!error && data) {
          profile = {
            id: data.id,
            player_name: data.player_name,
            player_role: data.player_role,
            callsign: data.callsign,
            created_at: data.created_at,
            updated_at: data.updated_at,
          }
          localStorage.setItem(LS_PROFILE, JSON.stringify(profile))
        }
      } catch (err) {
        console.error('Supabase profile creation error:', err)
      }
    }
  }

  // Get or create stats
  let stats = await getStats(profile.id)
  
  if (!stats.id || !stats.player_id) {
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from('player_stats')
          .insert({
            player_id: profile.id,
            total_xp: 0,
            total_checkins: 0,
            current_streak: 0,
            longest_streak: 0,
            unlocked_badges: [],
          })
          .select()
          .single()

        if (!error && data) {
          stats = {
            id: data.id,
            player_id: data.player_id,
            total_xp: data.total_xp,
            total_checkins: data.total_checkins,
            current_streak: data.current_streak,
            longest_streak: data.longest_streak,
            last_checkin_date: data.last_checkin_date,
            unlocked_badges: data.unlocked_badges || [],
            created_at: data.created_at,
            updated_at: data.updated_at,
          }
          localStorage.setItem(LS_STATS, JSON.stringify(stats))
        }
      } catch (err) {
        console.error('Supabase stats creation error:', err)
      }
    }
  }

  return { profile, stats, playerId: profile.id }
}

// Calculate XP gain for a check-in
export function calculateXpGain(
  allLogged: boolean,
  _currentStats: StatsData
): number {
  if (allLogged) return 25 // Full panel bonus
  return 10 // Regular check-in
}

// Check and award badges
export function checkAndAwardBadges(
  stats: StatsData,
  allLogged: boolean
): string[] {
  const newBadges = [...stats.unlocked_badges]
  
  // Badge: First Log
  if (stats.total_checkins >= 1 && !newBadges.includes('first-log')) {
    newBadges.push('first-log')
  }
  
  // Badge: One Week Strong (7 days)
  if (stats.total_checkins >= 7 && !newBadges.includes('week-streak')) {
    newBadges.push('week-streak')
  }
  
  // Badge: Mission Month (30 days)
  if (stats.total_checkins >= 30 && !newBadges.includes('perfect-month')) {
    newBadges.push('perfect-month')
  }
  
  // Badge: Full Panel (all indicators logged)
  if (allLogged && !newBadges.includes('all-indicators')) {
    newBadges.push('all-indicators')
  }
  
  // Badge: Early Bird (would need time-based check)
  // Badge: Two Weeks (14 days)
  if (stats.total_checkins >= 14 && !newBadges.includes('streak-14')) {
    newBadges.push('streak-14')
  }
  
  // Badge: Health Guardian (30 days of healthy readings)
  if (stats.total_checkins >= 30 && !newBadges.includes('guardian')) {
    newBadges.push('guardian')
  }
  
  // Badge: Deep Space Explorer (100 total check-ins)
  if (stats.total_checkins >= 100 && !newBadges.includes('explorer')) {
    newBadges.push('explorer')
  }
  
  return newBadges
}

// Sync all local data to Supabase (batch operation)
export async function syncAllDataToSupabase(playerId: string): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return

  try {
    // Sync readings
    const readings = getAllLocalReadings()
    for (const [indicatorId, indicatorReadings] of Object.entries(readings)) {
      for (const reading of indicatorReadings) {
        const { error } = await supabase
          .from('health_readings')
          .upsert({
            player_id: playerId,
            indicator_id: indicatorId,
            value: reading.value,
            notes: reading.notes,
            created_at: new Date(reading.timestamp).toISOString(),
          }, {
            onConflict: 'created_at',
          })
        
        if (error) console.error('Sync reading error:', error)
      }
    }
  } catch (err) {
    console.error('Supabase sync error:', err)
  }
}
