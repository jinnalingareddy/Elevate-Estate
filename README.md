# EstateElevate

Luxury real estate marketplace for Mexico and LATAM. Agents publish properties, buyers browse and contact agents, and everything is billed through Conekta.

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Auth |
| Payments | Conekta (MXN subscriptions + pay-per-listing) |
| Images | Cloudinary + next-cloudinary |
| Email | Resend + React Email |
| i18n | next-intl (ES default, EN) |
| Rate limiting | Upstash Redis |
| Maps | Leaflet + react-leaflet |
| Monitoring | Sentry |
| Deployment | Vercel |

## Project Structure

```
estateelevate/
├── app/
│   ├── [locale]/               # All user-facing pages (i18n-aware)
│   │   ├── page.tsx            # Home page
│   │   ├── search/             # Property search with map
│   │   ├── propiedades/[slug]/ # Property detail
│   │   ├── agent/              # Agent portal (auth-gated)
│   │   │   ├── auth/           # Login / register
│   │   │   ├── dashboard/
│   │   │   ├── listings/       # CRUD for properties
│   │   │   ├── leads/          # Lead pipeline
│   │   │   ├── plans/          # Upgrade / pay-per-listing
│   │   │   ├── subscriptions/
│   │   │   ├── settings/
│   │   │   └── support/
│   │   ├── admin/              # Admin panel (role=admin only)
│   │   │   ├── dashboard/
│   │   │   ├── agents/
│   │   │   └── listings/
│   │   └── legal/              # Terms + privacy
│   ├── api/
│   │   ├── leads/              # Lead form submission
│   │   ├── conekta/            # Checkout endpoints
│   │   ├── webhooks/conekta/   # Payment webhook handler
│   │   ├── cron/               # Grace-period expiry job
│   │   ├── admin/              # Admin ban/unban/feature/delete
│   │   ├── agent/profile       # Profile PATCH
│   │   ├── support/ticket      # Support ticket POST
│   │   └── sitemap.xml         # Dynamic XML sitemap
│   └── i18n/
│       └── request.ts          # Server locale resolution
├── components/
│   ├── ui/                     # Design system (Button, Card, Modal…)
│   ├── layout/                 # Navbar, Footer, AgentSidebar, AdminSidebar
│   ├── home/                   # HeroContent, FeaturedSection
│   ├── search/                 # SearchBar, FilterBar, MapView, ListingList
│   ├── property/               # Gallery, Map, AgentSidebar, DescriptionToggle
│   ├── agent/                  # Dashboard shells, ListingForm, LeadsTable…
│   └── admin/                  # AgentsClient, ListingsClient
├── emails/                     # React Email templates
│   ├── WelcomeEmail.tsx
│   ├── NewLeadEmail.tsx
│   ├── PaymentReceiptEmail.tsx
│   ├── PaymentFailedEmail.tsx
│   └── ListingsDraftedEmail.tsx
├── lib/
│   ├── cloudinary.ts           # URL helpers (client-safe)
│   ├── cloudinary-server.ts    # Upload/delete (server-only)
│   ├── conekta.ts              # Checkout + webhook verification
│   ├── config.ts               # Plan limits, pricing, app constants
│   ├── email.ts                # Resend send functions
│   ├── navigation.ts           # next-intl Link/redirect/useRouter
│   ├── rate-limit.ts           # Upstash Redis limiters
│   ├── slug.ts                 # Slugify utility
│   └── supabase/
│       ├── client.ts           # Browser Supabase client
│       ├── server.ts           # Server clients (anon + service role)
│       ├── types.ts            # TypeScript types for all DB tables
│       └── queries/            # listings, leads, subscriptions
├── messages/
│   ├── es.json                 # Spanish translations (default)
│   └── en.json                 # English translations
├── public/
│   └── robots.txt
└── supabase/
    └── schema.sql              # Full DB schema (run once in Supabase SQL editor)
```

## Plans & Pricing

| Plan | Listings | Featured | Price |
|---|---|---|---|
| Free | 1 | 0 | MXN $0 |
| Pro | 10 | 2 | MXN $799/mo |
| Elite | 50 | 10 | MXN $1,999/mo |

Agents can also buy a single extra listing slot for MXN $299 (valid 365 days).

When a subscription is cancelled or a payment fails, the account enters a 3-day grace period. If payment isn't updated in time, listings that exceed the free plan limit are automatically moved to draft via the daily cron job.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set environment variables

Copy `.env.example` to `.env.local` and fill in each value:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-only, bypasses RLS) |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name |
| `CLOUDINARY_API_KEY` | Cloudinary API key |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret |
| `CONEKTA_PRIVATE_KEY` | Conekta private key (server-only) |
| `NEXT_PUBLIC_CONEKTA_PUBLIC_KEY` | Conekta public key |
| `CONEKTA_WEBHOOK_SECRET` | Secret for verifying Conekta webhook signatures |
| `RESEND_API_KEY` | Resend API key |
| `RESEND_FROM_EMAIL` | Sender address (must be a verified Resend domain) |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN (client + server) |
| `SENTRY_ORG` | Sentry organization slug (build-time source map upload) |
| `SENTRY_PROJECT` | Sentry project slug |
| `SENTRY_AUTH_TOKEN` | Sentry auth token (only needed in CI) |
| `NEXT_PUBLIC_APP_URL` | Full app URL, e.g. `https://estateelevate.mx` |
| `CRON_SECRET` | Secret for authenticating the cron endpoint (`Authorization: Bearer <secret>`) |

### 3. Provision the database

Open the Supabase SQL editor and run `supabase/schema.sql` in full. This creates all tables, enums, RLS policies, and indexes.

### 4. Configure Conekta

Create two subscription plans in your Conekta dashboard with IDs matching `lib/config.ts`:
- `plan_pro_mensual` — MXN $799/month
- `plan_elite_mensual` — MXN $1,999/month

Set the webhook URL to `https://your-domain/api/webhooks/conekta` and note the signing secret.

### 5. Run locally

```bash
npm run dev
```

## Key Commands

```bash
npm run dev          # Start development server
npm run build        # Production build (runs type-check)
npm run type-check   # TypeScript only, no emit
npm run lint         # ESLint
```

## Authentication & Authorization

- **Public routes** — home, search, property detail, legal pages
- **`/agent/*`** — requires any authenticated user; `role=banned` is ejected
- **`/admin/*`** — requires `role=admin`
- **API routes** — auth checked inside each handler; webhooks and crons use their own secrets

Auth is enforced in `middleware.ts` using `supabase.auth.getUser()` (network call, not cookie-trust).

## Payments Flow

```
Agent clicks "Upgrade" → POST /api/conekta/checkout-subscription
                       → Redirect to Conekta hosted page
                       → Conekta fires POST /api/webhooks/conekta
                       → subscription.paid → upsert subscription row
                       → Send payment receipt email
```

For pay-per-listing:
```
Agent clicks "Comprar espacio" → POST /api/conekta/checkout-single
                               → order.paid webhook → insert listing_slots row
```

## Email Templates

All transactional emails are React Email components rendered server-side and sent via Resend.

| Template | Trigger |
|---|---|
| `WelcomeEmail` | New agent registration |
| `NewLeadEmail` | Buyer submits contact form |
| `PaymentReceiptEmail` | Successful payment (subscription or one-time) |
| `PaymentFailedEmail` | Subscription renewal fails |
| `ListingsDraftedEmail` | Listings moved to draft after downgrade/cancellation |

## Cron Jobs

| Schedule | Path | Purpose |
|---|---|---|
| `0 8 * * *` (08:00 UTC daily) | `/api/cron/check-grace-periods` | Expire grace periods, downgrade accounts, draft excess listings |

The cron is registered in `vercel.json` and authenticated with `Authorization: Bearer <CRON_SECRET>`.

## i18n

Default locale is Spanish (`es`) with no URL prefix. English uses `/en/` prefix.

Translation files live in `messages/es.json` and `messages/en.json`. The locale is resolved from the URL segment first, with a cookie (`locale`) as fallback, then defaults to `es`.

## Security

- All routes return `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, and `Strict-Transport-Security` headers (set in `next.config.js`).
- Rate limiting on all API routes via Upstash Redis — stricter limits on auth, checkout, and lead form endpoints.
- Lead forms include a honeypot field and a timing check to silently drop bot submissions.
- Webhook signatures are verified with HMAC-SHA256 before any processing.
- Webhook events are deduplicated via an `webhook_events` table to prevent replay attacks.
- The service role Supabase key is never exposed to the client; only used in API routes, webhooks, and cron jobs.
