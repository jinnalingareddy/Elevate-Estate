-- ============================================================
-- EstateElevate — Test Data Seed  (v2 — no hard-coded UUIDs)
-- Run this in: Supabase Dashboard → SQL Editor
--
-- Key design decisions:
--   • auth.users uses gen_random_uuid() — Supabase picks the ID
--   • handle_new_user trigger auto-creates the profile row
--   • Every FK lookup uses (SELECT id FROM profiles WHERE email = '...')
--     so the UUID mismatch problem is impossible
--   • ON CONFLICT guards make the script safe to re-run
-- ============================================================

-- ----------------------------------------------------------------
-- 0. CLEAN SLATE (optional — comment out if you want to keep data)
-- ----------------------------------------------------------------
-- DELETE FROM public.support_tickets;
-- DELETE FROM public.favorites;
-- DELETE FROM public.leads;
-- DELETE FROM public.listing_views;
-- DELETE FROM public.listing_slots;
-- DELETE FROM public.subscriptions;
-- DELETE FROM public.listings;
-- DELETE FROM public.profiles;
-- DELETE FROM auth.users WHERE email LIKE '%estateelevate%';

-- ----------------------------------------------------------------
-- 1. AUTH USERS
--    gen_random_uuid() lets Supabase assign the ID.
--    The handle_new_user trigger fires automatically and creates
--    a bare profile row — we UPDATE those rows in step 2.
-- ----------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role,
  email, encrypted_password,
  email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  is_super_admin, is_sso_user, deleted_at
)
SELECT
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated', 'authenticated',
  u.email,
  crypt(u.pwd, gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}',
  jsonb_build_object('full_name', u.name),
  now(), now(),
  false, false, null
FROM (VALUES
  ('carlos.garcia@estateelevate.mx',     'Carlos García',         'TestPassword123!'),
  ('maria.lopez@estateelevate.mx',       'María López',           'TestPassword123!'),
  ('juan.martinez@estateelevate.mx',     'Juan Martínez',         'TestPassword123!'),
  ('paula.sanchez@estateelevate.mx',     'Paula Sánchez',         'TestPassword123!'),
  ('roberto.hernandez@estateelevate.mx', 'Roberto Hernández',     'TestPassword123!'),
  ('lucia.gonzalez@estateelevate.mx',    'Lucía González',        'TestPassword123!'),
  ('fernando.torres@estateelevate.mx',   'Fernando Torres',       'TestPassword123!'),
  ('claudia.ramirez@estateelevate.mx',   'Claudia Ramírez',       'TestPassword123!'),
  ('admin@estateelevate.mx',             'Admin EstateElevate',   'AdminPassword123!'),
  ('test.buyer@estateelevate.mx',        'Test Buyer',            'TestPassword123!')
) AS u(email, name, pwd)
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users WHERE email = u.email
);

-- ----------------------------------------------------------------
-- 2. PROFILES — UPDATE the auto-created rows with full details
--    Uses email to find the right row — no UUID needed here.
-- ----------------------------------------------------------------
UPDATE public.profiles SET
  phone       = '5255100000001',
  role        = 'agent',
  agency_name = 'Premier Inmobiliario',
  bio         = 'Especialista en propiedades de lujo en la CDMX con más de 10 años de experiencia.',
  verified    = true,
  plan        = 'pro'
WHERE email = 'carlos.garcia@estateelevate.mx';

UPDATE public.profiles SET
  phone       = '5255100000002',
  role        = 'agent',
  agency_name = 'Luxury Homes México',
  bio         = 'Agente certificada en bienes raíces residenciales y comerciales.',
  verified    = true,
  plan        = 'elite'
WHERE email = 'maria.lopez@estateelevate.mx';

UPDATE public.profiles SET
  phone       = '5255100000003',
  role        = 'agent',
  agency_name = 'Elite Properties',
  bio         = 'Más de 15 años conectando familias con su hogar ideal.',
  verified    = true,
  plan        = 'pro'
WHERE email = 'juan.martinez@estateelevate.mx';

UPDATE public.profiles SET
  phone       = '5255100000004',
  role        = 'agent',
  agency_name = 'Realty Group Internacional',
  bio         = 'Experta en desarrollos inmobiliarios en zonas turísticas.',
  verified    = true,
  plan        = 'elite'
WHERE email = 'paula.sanchez@estateelevate.mx';

UPDATE public.profiles SET
  phone       = '5255100000005',
  role        = 'agent',
  agency_name = 'Casa Elegante',
  bio         = 'Especialista en propiedades residenciales en Monterrey.',
  verified    = true,
  plan        = 'free'
WHERE email = 'roberto.hernandez@estateelevate.mx';

UPDATE public.profiles SET
  phone       = '5255100000006',
  role        = 'agent',
  agency_name = 'Propiedades del Futuro',
  bio         = 'Innovadora en el mercado inmobiliario con enfoque digital.',
  verified    = true,
  plan        = 'pro'
WHERE email = 'lucia.gonzalez@estateelevate.mx';

UPDATE public.profiles SET
  phone       = '5255100000007',
  role        = 'agent',
  agency_name = 'Inmobiliaria Central',
  bio         = 'Asesor inmobiliario con amplia cartera en el Bajío.',
  verified    = false,
  plan        = 'free'
WHERE email = 'fernando.torres@estateelevate.mx';

UPDATE public.profiles SET
  phone       = '5255100000008',
  role        = 'agent',
  agency_name = 'Top Tier Real Estate',
  bio         = 'Propiedades premium en Guadalajara y Zapopan.',
  verified    = true,
  plan        = 'elite'
WHERE email = 'claudia.ramirez@estateelevate.mx';

UPDATE public.profiles SET
  phone    = '5255100000009',
  role     = 'admin',
  verified = true,
  plan     = 'elite'
WHERE email = 'admin@estateelevate.mx';

UPDATE public.profiles SET
  phone    = '5255200000001',
  role     = 'buyer',
  verified = true,
  plan     = 'free'
WHERE email = 'test.buyer@estateelevate.mx';

-- ----------------------------------------------------------------
-- 3. SUBSCRIPTIONS — agent_id looked up by email
-- ----------------------------------------------------------------
INSERT INTO public.subscriptions (agent_id, plan, status, current_period_start, current_period_end, cancel_at_period_end)
SELECT id, 'pro',   'active',   now(), now() + interval '30 days', false FROM public.profiles WHERE email = 'carlos.garcia@estateelevate.mx'
ON CONFLICT (agent_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, updated_at = now();

INSERT INTO public.subscriptions (agent_id, plan, status, current_period_start, current_period_end, cancel_at_period_end)
SELECT id, 'elite', 'active',   now(), now() + interval '30 days', false FROM public.profiles WHERE email = 'maria.lopez@estateelevate.mx'
ON CONFLICT (agent_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, updated_at = now();

INSERT INTO public.subscriptions (agent_id, plan, status, current_period_start, current_period_end, cancel_at_period_end)
SELECT id, 'pro',   'active',   now(), now() + interval '30 days', false FROM public.profiles WHERE email = 'juan.martinez@estateelevate.mx'
ON CONFLICT (agent_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, updated_at = now();

INSERT INTO public.subscriptions (agent_id, plan, status, current_period_start, current_period_end, cancel_at_period_end)
SELECT id, 'elite', 'active',   now(), now() + interval '30 days', false FROM public.profiles WHERE email = 'paula.sanchez@estateelevate.mx'
ON CONFLICT (agent_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, updated_at = now();

INSERT INTO public.subscriptions (agent_id, plan, status, current_period_start, current_period_end, cancel_at_period_end)
SELECT id, 'free',  'active',   now(), now() + interval '30 days', false FROM public.profiles WHERE email = 'roberto.hernandez@estateelevate.mx'
ON CONFLICT (agent_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, updated_at = now();

INSERT INTO public.subscriptions (agent_id, plan, status, current_period_start, current_period_end, cancel_at_period_end)
SELECT id, 'pro',   'active',   now(), now() + interval '30 days', false FROM public.profiles WHERE email = 'lucia.gonzalez@estateelevate.mx'
ON CONFLICT (agent_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, updated_at = now();

INSERT INTO public.subscriptions (agent_id, plan, status, current_period_start, current_period_end, cancel_at_period_end)
SELECT id, 'free',  'active',   now(), now() + interval '30 days', false FROM public.profiles WHERE email = 'fernando.torres@estateelevate.mx'
ON CONFLICT (agent_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, updated_at = now();

INSERT INTO public.subscriptions (agent_id, plan, status, current_period_start, current_period_end, cancel_at_period_end)
SELECT id, 'elite', 'trialing', now(), now() + interval '14 days', false FROM public.profiles WHERE email = 'claudia.ramirez@estateelevate.mx'
ON CONFLICT (agent_id) DO UPDATE SET plan = EXCLUDED.plan, status = EXCLUDED.status, updated_at = now();

-- ----------------------------------------------------------------
-- 4. LISTINGS — agent_id looked up by email via subquery
--    ON CONFLICT on slug so re-runs are safe.
-- ----------------------------------------------------------------
INSERT INTO public.listings (
  agent_id, title, slug, description,
  property_type, status, featured, price, currency,
  address, neighborhood, city, state, country, postal_code,
  lat, lng, bedrooms, bathrooms, parking_spots,
  total_area, built_area, amenities, images, views, year_built
)
VALUES

-- 1 · HOUSE · Polanco · featured
(
  (SELECT id FROM public.profiles WHERE email = 'carlos.garcia@estateelevate.mx'),
  'Casa de Lujo en Polanco', 'casa-de-lujo-en-polanco',
  'Espectacular residencia en la exclusiva colonia Polanco. Acabados de primera calidad, jardín privado y alberca. Ideal para familias que buscan comodidad y seguridad en el corazón de la CDMX.',
  'house', 'active', true, 4500000, 'MXN',
  'Emilio Castelar 215', 'Polanco', 'Ciudad de México', 'Ciudad de México', 'México', '11550',
  19.43270000, -99.19330000, 4, 3.5, 2, 320.00, 290.00,
  '["alberca","jardín","seguridad 24h","cocina integral","bodega"]',
  '[{"url":"https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800","caption":"Fachada principal"}]',
  142, 2018
),

-- 2 · APARTMENT · Santa Fe
(
  (SELECT id FROM public.profiles WHERE email = 'maria.lopez@estateelevate.mx'),
  'Departamento Moderno en Santa Fe', 'departamento-moderno-santa-fe',
  'Moderno departamento con vista panorámica a Santa Fe. Amenidades de lujo: gimnasio, spa, salón de eventos y concierge 24 hrs.',
  'apartment', 'active', false, 2800000, 'MXN',
  'Av. Santa Fe 505, Torre A Piso 18', 'Santa Fe', 'Ciudad de México', 'Ciudad de México', 'México', '05349',
  19.35910000, -99.26150000, 2, 2.0, 1, 115.00, 110.00,
  '["gimnasio","spa","salón de eventos","concierge","estacionamiento"]',
  '[{"url":"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800","caption":"Sala principal"}]',
  89, 2022
),

-- 3 · HOUSE · Roma Norte · featured
(
  (SELECT id FROM public.profiles WHERE email = 'juan.martinez@estateelevate.mx'),
  'Villa Contemporánea en Roma Norte', 'villa-contemporanea-roma-norte',
  'Casa completamente remodelada en Roma Norte. Tres niveles, rooftop con jacuzzi, acabados de diseñador y sistema de domótica completo.',
  'house', 'active', true, 5800000, 'MXN',
  'Orizaba 88', 'Roma Norte', 'Ciudad de México', 'Ciudad de México', 'México', '06700',
  19.41880000, -99.16190000, 3, 3.0, 1, 280.00, 265.00,
  '["rooftop","jacuzzi","domótica","cocina italiana","bodega"]',
  '[{"url":"https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800","caption":"Fachada"}]',
  213, 2010
),

-- 4 · CONDO · Zona Hotelera Cancún · featured
(
  (SELECT id FROM public.profiles WHERE email = 'paula.sanchez@estateelevate.mx'),
  'Penthouse de Lujo Zona Hotelera Cancún', 'penthouse-lujo-zona-hotelera-cancun',
  'Penthouse frente al mar Caribe con vista de 360°. Terraza privada, alberca infinity, cocina tipo chef y acabados importados.',
  'condo', 'active', true, 5500000, 'MXN',
  'Blvd. Kukulcán km 16.5', 'Zona Hotelera', 'Cancún', 'Quintana Roo', 'México', '77500',
  21.06290000, -86.82350000, 3, 3.5, 2, 320.00, 295.00,
  '["alberca infinity","vista al mar","playa privada","bar","concierge"]',
  '[{"url":"https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800","caption":"Vista al Caribe"}]',
  312, 2020
),

-- 5 · HOUSE · Cumbres Monterrey · featured
(
  (SELECT id FROM public.profiles WHERE email = 'roberto.hernandez@estateelevate.mx'),
  'Villa Moderna en Cumbres Monterrey', 'villa-moderna-cumbres-monterrey',
  'Residencia de alto standing en Cumbres Elite. Diseño arquitectónico único, sistema solar y jardín zen.',
  'house', 'active', true, 7200000, 'MXN',
  'Privada Los Robles 42', 'Cumbres Elite', 'Monterrey', 'Nuevo León', 'México', '64610',
  25.73520000, -100.36870000, 5, 4.5, 3, 540.00, 480.00,
  '["alberca","jardín zen","sistema solar","cine en casa","bodega","cuarto servicio"]',
  '[{"url":"https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800","caption":"Exterior"}]',
  178, 2021
),

-- 6 · APARTMENT · Chapultepec Guadalajara
(
  (SELECT id FROM public.profiles WHERE email = 'claudia.ramirez@estateelevate.mx'),
  'Loft Vanguardista en Chapultepec Guadalajara', 'loft-vanguardista-chapultepec-guadalajara',
  'Loft de diseño en la colonia más bohemia de Guadalajara. Techos altos, luz natural y terraza privada.',
  'apartment', 'active', false, 1850000, 'MXN',
  'Av. Chapultepec 480 Piso 7', 'Chapultepec', 'Guadalajara', 'Jalisco', 'México', '44190',
  20.67160000, -103.37450000, 1, 1.0, 1, 85.00, 82.00,
  '["terraza","cocina integral","seguridad","área de coworking"]',
  '[{"url":"https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800","caption":"Interior loft"}]',
  67, 2023
),

-- 7 · LAND · Valle de Bravo
(
  (SELECT id FROM public.profiles WHERE email = 'lucia.gonzalez@estateelevate.mx'),
  'Terreno en Valle de Bravo con Vista al Lago', 'terreno-valle-de-bravo-vista-lago',
  'Terreno plano en zona residencial con impresionante vista al lago. Todos los servicios disponibles.',
  'land', 'active', false, 1200000, 'MXN',
  'Fracc. El Pedregal, Lote 14', 'El Pedregal', 'Valle de Bravo', 'Estado de México', 'México', '51200',
  19.19410000, -100.13180000, null, null, null, 800.00, null,
  '["servicios disponibles","vista al lago","uso residencial"]',
  '[{"url":"https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=800","caption":"Vista al lago"}]',
  45, null
),

-- 8 · COMMERCIAL · Masaryk Polanco
(
  (SELECT id FROM public.profiles WHERE email = 'carlos.garcia@estateelevate.mx'),
  'Local Comercial Premium en Presidente Masaryk', 'local-comercial-premium-masaryk',
  'Local comercial en planta baja sobre Presidente Masaryk. Alto tráfico peatonal, fachada de 8 m, bodega incluida.',
  'commercial', 'active', false, 6800000, 'MXN',
  'Presidente Masaryk 314 PB', 'Polanco', 'Ciudad de México', 'Ciudad de México', 'México', '11560',
  19.43600000, -99.20150000, null, 2.0, 1, 180.00, 175.00,
  '["fachada a calle principal","bodega","instalación eléctrica trifásica"]',
  '[{"url":"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800","caption":"Fachada"}]',
  93, 2015
),

-- 9 · CONDO · Playa del Carmen · pending
(
  (SELECT id FROM public.profiles WHERE email = 'paula.sanchez@estateelevate.mx'),
  'Condominio Frente al Mar Playa del Carmen', 'condominio-frente-mar-playa-del-carmen',
  'Condominio a 50 metros de la playa en la Quinta Avenida. Alberca comunitaria y seguridad 24h.',
  'condo', 'pending', false, 2200000, 'MXN',
  '5a Avenida Norte 890', 'Centro', 'Playa del Carmen', 'Quintana Roo', 'México', '77710',
  20.62760000, -87.08040000, 2, 2.0, 1, 95.00, 90.00,
  '["alberca","acceso playa","amueblado"]',
  '[{"url":"https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?w=800","caption":"Vista al mar"}]',
  55, 2019
),

-- 10 · HOUSE · San Ángel · draft (tests draft-status flow)
(
  (SELECT id FROM public.profiles WHERE email = 'juan.martinez@estateelevate.mx'),
  'Residencia San Ángel en Venta', 'residencia-san-angel-en-venta',
  'Residencia colonial en San Ángel con jardín enorme y fuente central. Totalmente restaurada.',
  'house', 'draft', false, 8900000, 'MXN',
  'Av. Revolución 1520', 'San Ángel', 'Ciudad de México', 'Ciudad de México', 'México', '01000',
  19.34710000, -99.19050000, 6, 4.0, 3, 680.00, 550.00,
  '["jardín enorme","fuente","cuartos de servicio","cochera techada"]',
  '[]',
  0, 1935
)

ON CONFLICT (slug) DO UPDATE SET
  title       = EXCLUDED.title,
  description = EXCLUDED.description,
  status      = EXCLUDED.status,
  featured    = EXCLUDED.featured,
  price       = EXCLUDED.price,
  updated_at  = now();

-- ----------------------------------------------------------------
-- 5. LISTING VIEWS (simulate organic traffic)
-- ----------------------------------------------------------------
INSERT INTO public.listing_views (listing_id, ip_hash, viewed_at)
SELECT l.id, md5('ip-001'), now() - interval '2 days'  FROM public.listings l WHERE l.slug = 'casa-de-lujo-en-polanco'
UNION ALL
SELECT l.id, md5('ip-002'), now() - interval '1 day'   FROM public.listings l WHERE l.slug = 'casa-de-lujo-en-polanco'
UNION ALL
SELECT l.id, md5('ip-003'), now() - interval '3 hours' FROM public.listings l WHERE l.slug = 'departamento-moderno-santa-fe'
UNION ALL
SELECT l.id, md5('ip-004'), now() - interval '5 hours' FROM public.listings l WHERE l.slug = 'villa-contemporanea-roma-norte'
UNION ALL
SELECT l.id, md5('ip-005'), now() - interval '1 hour'  FROM public.listings l WHERE l.slug = 'penthouse-lujo-zona-hotelera-cancun'
UNION ALL
SELECT l.id, md5('ip-006'), now() - interval '30 minutes' FROM public.listings l WHERE l.slug = 'villa-moderna-cumbres-monterrey'
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- 6. LEADS  (all lead_status values covered)
-- ----------------------------------------------------------------
INSERT INTO public.leads (listing_id, agent_id, name, email, phone, message, status, read, source)
VALUES
(
  (SELECT id FROM public.listings  WHERE slug  = 'casa-de-lujo-en-polanco'),
  (SELECT id FROM public.profiles  WHERE email = 'carlos.garcia@estateelevate.mx'),
  'Ana Rodríguez', 'ana.rodriguez@gmail.com', '5255300000001',
  'Me interesa agendar una visita. ¿Tienen disponibilidad este fin de semana?',
  'new', false, 'listing_page'
),
(
  (SELECT id FROM public.listings  WHERE slug  = 'departamento-moderno-santa-fe'),
  (SELECT id FROM public.profiles  WHERE email = 'maria.lopez@estateelevate.mx'),
  'Jorge Medina', 'jorge.medina@hotmail.com', '5255300000002',
  'Busco un departamento en Santa Fe. ¿Es negociable el precio?',
  'contacted', true, 'search_results'
),
(
  (SELECT id FROM public.listings  WHERE slug  = 'villa-contemporanea-roma-norte'),
  (SELECT id FROM public.profiles  WHERE email = 'juan.martinez@estateelevate.mx'),
  'Valentina Cruz', 'vcruz@empresa.com', '5255300000003',
  'Tenemos pre-aprobación bancaria por 6 millones. Queremos visitar con arquitecto.',
  'qualified', true, 'referral'
),
(
  (SELECT id FROM public.listings  WHERE slug  = 'penthouse-lujo-zona-hotelera-cancun'),
  (SELECT id FROM public.profiles  WHERE email = 'paula.sanchez@estateelevate.mx'),
  'Enrique Vega', 'enrique.vega@outlook.com', '5255300000004',
  'Ofrezco 5.2 millones de contado, cierre en 30 días.',
  'negotiating', true, 'listing_page'
),
(
  (SELECT id FROM public.listings  WHERE slug  = 'villa-moderna-cumbres-monterrey'),
  (SELECT id FROM public.profiles  WHERE email = 'roberto.hernandez@estateelevate.mx'),
  'Sofía Morales', 'sofia.morales@gmail.com', '5255300000005',
  'Proceso ya concluido. Gracias por su apoyo.',
  'closed', true, 'direct'
),
(
  (SELECT id FROM public.listings  WHERE slug  = 'local-comercial-premium-masaryk'),
  (SELECT id FROM public.profiles  WHERE email = 'carlos.garcia@estateelevate.mx'),
  'Rodrigo Fuentes', 'rfuentes@negocio.mx', '5255300000006',
  'Interesado en el local para restaurante japonés. ¿Cuál es el mínimo de contrato?',
  'new', false, 'google_ads'
)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- 7. FAVORITES  (buyer saves listings — looked up by slug)
-- ----------------------------------------------------------------
INSERT INTO public.favorites (user_id, listing_id)
VALUES
(
  (SELECT id FROM public.profiles WHERE email = 'test.buyer@estateelevate.mx'),
  (SELECT id FROM public.listings WHERE slug  = 'casa-de-lujo-en-polanco')
),
(
  (SELECT id FROM public.profiles WHERE email = 'test.buyer@estateelevate.mx'),
  (SELECT id FROM public.listings WHERE slug  = 'penthouse-lujo-zona-hotelera-cancun')
),
(
  (SELECT id FROM public.profiles WHERE email = 'test.buyer@estateelevate.mx'),
  (SELECT id FROM public.listings WHERE slug  = 'villa-moderna-cumbres-monterrey')
)
ON CONFLICT (user_id, listing_id) DO NOTHING;

-- ----------------------------------------------------------------
-- 8. SUPPORT TICKETS
-- ----------------------------------------------------------------
INSERT INTO public.support_tickets (user_id, email, subject, message, status, priority)
VALUES
(
  (SELECT id FROM public.profiles WHERE email = 'fernando.torres@estateelevate.mx'),
  'fernando.torres@estateelevate.mx',
  'No puedo subir fotos a mi propiedad',
  'Intento cargar imágenes pero el botón no responde. Estoy usando Chrome en Windows 11.',
  'open', 'high'
),
(
  (SELECT id FROM public.profiles WHERE email = 'roberto.hernandez@estateelevate.mx'),
  'roberto.hernandez@estateelevate.mx',
  'Quiero actualizar mi plan a Pro',
  '¿Cómo procedo al pago con tarjeta de crédito?',
  'in_progress', 'medium'
),
(
  (SELECT id FROM public.profiles WHERE email = 'test.buyer@estateelevate.mx'),
  'test.buyer@estateelevate.mx',
  'El agente no ha respondido mi mensaje',
  'Mandé un lead hace 3 días y no he recibido respuesta. Por favor apoyen.',
  'resolved', 'low'
),
(
  null,
  'anonimo@gmail.com',
  'Propiedad con información incorrecta',
  'La propiedad en Polanco dice 4 recámaras pero tiene 3. Favor de verificar.',
  'open', 'urgent'
)
ON CONFLICT DO NOTHING;

-- ----------------------------------------------------------------
-- 9. VERIFY — row counts after seed
-- ----------------------------------------------------------------
SELECT 'profiles'        AS "table", count(*) AS rows FROM public.profiles
UNION ALL
SELECT 'listings',                   count(*)          FROM public.listings
UNION ALL
SELECT 'subscriptions',              count(*)          FROM public.subscriptions
UNION ALL
SELECT 'listing_views',              count(*)          FROM public.listing_views
UNION ALL
SELECT 'leads',                      count(*)          FROM public.leads
UNION ALL
SELECT 'favorites',                  count(*)          FROM public.favorites
UNION ALL
SELECT 'support_tickets',            count(*)          FROM public.support_tickets
ORDER BY 1;
