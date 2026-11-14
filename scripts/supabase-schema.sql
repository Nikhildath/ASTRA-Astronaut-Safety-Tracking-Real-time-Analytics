-- ASTRA Space Health Monitor - Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Player profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_name TEXT NOT NULL DEFAULT 'Commander',
  player_role TEXT NOT NULL DEFAULT 'Mission Specialist',
  callsign TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health readings table
CREATE TABLE IF NOT EXISTS health_readings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  indicator_id TEXT NOT NULL,
  value NUMERIC NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast queries by player and indicator
CREATE INDEX IF NOT EXISTS idx_health_readings_player_indicator 
  ON health_readings(player_id, indicator_id, created_at DESC);

-- Player statistics table (for XP, streak, badges)
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INTEGER DEFAULT 0,
  total_checkins INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_checkin_date DATE,
  unlocked_badges TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Policies (using anon key - in production, use authenticated users)
CREATE POLICY "Public profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Anyone can insert their own profile" 
  ON profiles FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update their own profile" 
  ON profiles FOR UPDATE USING (true);

CREATE POLICY "Public readings are viewable by everyone" 
  ON health_readings FOR SELECT USING (true);

CREATE POLICY "Anyone can insert readings" 
  ON health_readings FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update their own stats" 
  ON player_stats FOR UPDATE USING (true);

CREATE POLICY "Anyone can insert stats" 
  ON player_stats FOR INSERT WITH CHECK (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_player_stats_updated_at
  BEFORE UPDATE ON player_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default profile if not exists
INSERT INTO profiles (player_name, player_role, callsign)
VALUES ('Commander', 'Mission Specialist', 'AUSTRALIS-4')
ON CONFLICT DO NOTHING;

-- Insert default player stats if not exists
INSERT INTO player_stats (player_id, total_xp, total_checkins, current_streak, longest_streak, unlocked_badges)
SELECT id, 0, 0, 0, 0, '{}'
FROM profiles
WHERE NOT EXISTS (SELECT 1 FROM player_stats WHERE player_id = profiles.id);
