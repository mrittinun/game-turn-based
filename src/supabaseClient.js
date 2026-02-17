import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// ⚠️ สำคัญ: ต้องสร้าง project ใน Supabase ก่อน และเอา URL + API Key มาใส่ที่นี่
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database Tables Schema:
// 
// 1. characters
//    - id (uuid, primary key)
//    - name (text)
//    - element (text)
//    - hp (integer)
//    - max_hp (integer)
//    - attack (integer)
//    - speed (integer)
//    - emoji (text)
//    - class (text)
//    - ability (text)
//    - image (text) - Base64 character card image
//    - created_at (timestamp)
//    - user_id (uuid) - optional for multi-user support
//
// 2. cards
//    - id (text, primary key)
//    - name (text)
//    - element (text)
//    - type (text) - 'ultimate', 'normal', 'passive'
//    - energy (integer)
//    - damage (integer)
//    - shield (integer)
//    - target_type (text)
//    - description (text)
//    - image (text) - Base64 skill card image
//    - character_id (uuid, foreign key to characters)
//    - created_at (timestamp)
//
// 3. character_cards (junction table)
//    - character_id (uuid, foreign key)
//    - card_id (text, foreign key)
//    - card_order (integer) - 0=passive, 1=normal, 2=support, 3=ultimate
