-- Fix broken image format in existing listings.
-- The seed stored {url, caption} but the app expects
-- {public_id, thumbnail_url, medium_url, large_url}.
-- Run this once in Supabase SQL Editor.

UPDATE public.listings
SET images = (
  SELECT jsonb_agg(
    jsonb_build_object(
      'public_id',     regexp_replace(img->>'url', '\?.*$', ''),
      'thumbnail_url', regexp_replace(img->>'url', '\?.*$', '') || '?w=400',
      'medium_url',    regexp_replace(img->>'url', '\?.*$', '') || '?w=800',
      'large_url',     regexp_replace(img->>'url', '\?.*$', '') || '?w=1600'
    )
  )
  FROM jsonb_array_elements(images) AS img
  WHERE img ? 'url'          -- only rows that have the old 'url' key
)
WHERE images @> '[{"url": ""}]'::jsonb IS NOT TRUE   -- broad match: any elem has 'url'
  AND images::text LIKE '%"url"%';

-- Verify
SELECT slug, images->0 AS first_image FROM public.listings ORDER BY slug;
