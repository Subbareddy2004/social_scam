-- ============================================================
-- Social Scam Detection Platform — Supabase Database Schema
-- Run this in the Supabase SQL Editor to create the tables.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── Users Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  aadhaar_uuid TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  account_type TEXT NOT NULL CHECK (account_type IN ('personal', 'business')),
  business_name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enforce: only ONE personal account per Aadhaar UUID
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_personal_aadhaar
  ON users (aadhaar_uuid)
  WHERE account_type = 'personal';

-- ─── Posts Table ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text_content TEXT,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected')),
  scam_confidence REAL,
  scam_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for fast feed queries
CREATE INDEX IF NOT EXISTS idx_posts_status_created
  ON posts (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_user
  ON posts (user_id);

-- ─── Row Level Security (optional, but recommended) ────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (our backend uses the service key)
CREATE POLICY "Service role full access on users"
  ON users FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access on posts"
  ON posts FOR ALL
  USING (true)
  WITH CHECK (true);

-- ─── Seed an Admin User ────────────────────────────────────
-- Password: admin123 (bcrypt hash)
-- Aadhaar UUID: 999999999999
INSERT INTO users (aadhaar_uuid, name, email, password_hash, account_type, role)
VALUES (
  '999999999999',
  'Admin',
  'admin@socialscam.com',
  '$2b$10$7WtKwtE.aVsgDC7fAhz.H.5X3h0vobg8rqO/B..pYw4GSlBCf707q',
  'personal',
  'admin'
) ON CONFLICT (email) DO NOTHING;

-- If the admin already exists, update the password hash:
UPDATE users
SET password_hash = '$2b$10$7WtKwtE.aVsgDC7fAhz.H.5X3h0vobg8rqO/B..pYw4GSlBCf707q'
WHERE email = 'admin@socialscam.com';

-- ─── Create Storage Bucket for Post Images ──────────────────
-- Run this separately in the Supabase dashboard or via API:
-- 1. Go to Storage → Create bucket → Name: "post-images" → Public: true
