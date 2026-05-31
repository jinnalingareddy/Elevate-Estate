-- Add notification preference columns to profiles table.
-- These columns are referenced in the profile API route and settings page
-- but were missing from the database schema.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS email_notifications boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS whatsapp_notifications boolean NOT NULL DEFAULT true;
