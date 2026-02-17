-- ============================================
-- AXIE CLONE RPG - SUPABASE DATABASE SCHEMA
-- ============================================
-- คัดลอก SQL นี้ไปรันใน Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLE: characters
-- ============================================
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  element TEXT NOT NULL,
  hp INTEGER NOT NULL,
  max_hp INTEGER NOT NULL,
  attack INTEGER NOT NULL,
  speed INTEGER NOT NULL,
  emoji TEXT,
  class TEXT,
  ability TEXT,
  image TEXT, -- Base64 character card image
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Optional: for multi-user support
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_characters_element ON characters(element);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON characters(created_at DESC);

-- ============================================
-- TABLE: cards
-- ============================================
CREATE TABLE IF NOT EXISTS cards (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  element TEXT NOT NULL,
  type TEXT NOT NULL, -- 'ultimate', 'normal', 'passive'
  energy INTEGER NOT NULL,
  damage INTEGER NOT NULL,
  shield INTEGER NOT NULL DEFAULT 0,
  target_type TEXT, -- 'front', 'back', 'lowest', 'highest', 'all', 'self'
  description TEXT,
  image TEXT, -- Base64 skill card image
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_cards_element ON cards(element);
CREATE INDEX IF NOT EXISTS idx_cards_type ON cards(type);
CREATE INDEX IF NOT EXISTS idx_cards_character_id ON cards(character_id);

-- ============================================
-- TABLE: character_cards (Junction Table)
-- ============================================
CREATE TABLE IF NOT EXISTS character_cards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  card_id TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  card_order INTEGER NOT NULL, -- 0=passive, 1=normal, 2=support, 3=ultimate
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(character_id, card_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_character_cards_character_id ON character_cards(character_id);
CREATE INDEX IF NOT EXISTS idx_character_cards_card_id ON character_cards(card_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Enable RLS
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_cards ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access (for game play)
CREATE POLICY "Allow public read access to characters"
  ON characters FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to cards"
  ON cards FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to character_cards"
  ON character_cards FOR SELECT
  USING (true);

-- Policy: Allow authenticated users to insert/update/delete their own data
CREATE POLICY "Allow authenticated users to insert characters"
  ON characters FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update their own characters"
  ON characters FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL)
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Allow authenticated users to delete their own characters"
  ON characters FOR DELETE
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Policy: Allow authenticated users to manage cards
CREATE POLICY "Allow authenticated users to insert cards"
  ON cards FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update cards"
  ON cards FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete cards"
  ON cards FOR DELETE
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to manage character_cards
CREATE POLICY "Allow authenticated users to insert character_cards"
  ON character_cards FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete character_cards"
  ON character_cards FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update updated_at for characters
CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Auto-update updated_at for cards
CREATE TRIGGER update_cards_updated_at
  BEFORE UPDATE ON cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA (Optional - ข้อมูลเริ่มต้น)
-- ============================================
-- คุณสามารถเพิ่มข้อมูลเริ่มต้นจาก gameData.js ได้ที่นี่
