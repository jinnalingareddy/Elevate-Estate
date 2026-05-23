-- Add structured address columns to listings table.
-- Existing columns (address, neighborhood, city, state, postal_code) are kept intact
-- for backward compatibility with existing listings data.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS calle_numero       TEXT,
  ADD COLUMN IF NOT EXISTS numero_interior    TEXT,
  ADD COLUMN IF NOT EXISTS alcaldia_municipio TEXT,
  ADD COLUMN IF NOT EXISTS referencias        TEXT;

-- Grant access to the anon and authenticated roles so PostgREST can read/write.
GRANT SELECT, INSERT, UPDATE ON public.listings TO anon, authenticated;
