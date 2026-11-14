// Type definitions for ASTRA Space Health Monitor

export interface ProfileData {
  id: string
  player_name: string
  player_role: string
  callsign?: string
  created_at?: string
  updated_at?: string
}

export interface Profile {
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

export interface PlayerStats {
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
  indicatorId: string
  value: number
  timestamp: number
  notes?: string
}

export interface PlayerData {
  profile: Profile
  stats: PlayerStats
  playerId: string
}
