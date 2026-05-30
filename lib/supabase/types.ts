// ─── Enums ────────────────────────────────────────────────────────────────────

export type PropertyType = "house" | "apartment" | "condo" | "land" | "commercial";
export type ListingStatus = "active" | "pending" | "sold" | "draft";
export type ListingType = "for_sale" | "for_rent" | "both";
export type LeadStatus = "new" | "contacted" | "qualified" | "negotiating" | "closed";
export type PlanType = "free" | "pro" | "elite";
export type ProfileRole = "buyer" | "seller" | "agent" | "admin" | "banned";

// ─── Shared ───────────────────────────────────────────────────────────────────

export interface ListingImage {
  public_id: string;
  thumbnail_url: string;
  medium_url: string;
  large_url: string;
}

// ─── Tables ───────────────────────────────────────────────────────────────────

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  whatsapp: string | null;
  agency_name: string | null;
  bio: string | null;
  website: string | null;
  verified: boolean;
  role: ProfileRole;
  plan: PlanType;
  created_at: string;
  updated_at: string;
}

export interface Listing {
  id: string;
  agent_id: string;
  title: string;
  slug: string;
  description: string;
  property_type: PropertyType;
  status: ListingStatus;
  listing_type: ListingType;
  featured: boolean;
  price: number;
  currency: string;
  bedrooms: number | null;
  bathrooms: number | null;
  parking_spots: number | null;
  total_area: number | null;
  built_area: number | null;
  address: string;
  neighborhood: string | null;
  city: string;
  state: string;
  country: string;
  postal_code: string | null;
  calle_numero: string | null;
  numero_interior: string | null;
  alcaldia_municipio: string | null;
  referencias: string | null;
  lat: number | null;
  lng: number | null;
  images: ListingImage[];
  amenities: string[];
  virtual_tour_url: string | null;
  video_url: string | null;
  views: number;
  year_built: number | null;
  maintenance_fee: number | null;
  created_at: string;
  updated_at: string;
  // joined
  profiles?: Profile;
}

/** Subset of Listing returned by card-display queries (getListings, getFeaturedListings, getSimilarListings). */
export type ListingCard = Pick<
  Listing,
  | "id"
  | "slug"
  | "title"
  | "price"
  | "currency"
  | "city"
  | "neighborhood"
  | "bedrooms"
  | "bathrooms"
  | "total_area"
  | "status"
  | "listing_type"
  | "property_type"
  | "featured"
  | "images"
  | "created_at"
> & {
  area_sqm?: number | null;
  agent_id?: string;
  description?: string;
  virtual_tour_url?: string | null;
  profiles?: Pick<Profile, "id" | "full_name" | "avatar_url"> & {
    phone?: string | null;
    whatsapp?: string | null;
  };
};

export type MapPin = {
  id: string;
  lat: number;
  lng: number;
  price: number;
  title: string;
  slug: string;
};

export interface Lead {
  id: string;
  listing_id: string | null;
  agent_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  status: LeadStatus;
  read: boolean;
  source: string | null;
  created_at: string;
  updated_at: string;
  // joined
  listings?: Pick<Listing, "id" | "title" | "slug">;
}

export interface Subscription {
  id: string;
  agent_id: string;
  plan: PlanType;
  conekta_customer_id: string | null;
  conekta_subscription_id: string | null;
  status:
    | "active"
    | "trialing"
    | "past_due"
    | "cancelled"
    | "unpaid"
    | "grace_period";
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  grace_period_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface ListingSlot {
  id: string;
  agent_id: string;
  listing_id: string | null;
  conekta_order_id: string;
  active: boolean;
  expires_at: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_id: string;
  created_at: string;
  listings?: Listing;
}

export interface ListingView {
  id: string;
  listing_id: string;
  ip_hash: string;
  viewed_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string | null;
  email: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "low" | "medium" | "high" | "urgent";
  created_at: string;
  updated_at: string;
}

export interface WebhookEvent {
  id: string;
  provider: string;
  event_type: string;
  payload: Record<string, unknown>;
  processed: boolean;
  error: string | null;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
  // joined
  profiles?: Pick<Profile, "full_name" | "email"> | null;
}

// ─── Input types ──────────────────────────────────────────────────────────────

export interface ListingFilters {
  city?: string;
  neighborhood?: string;
  state?: string;
  property_type?: PropertyType[];
  listing_type?: ListingType;
  min_price?: number;
  max_price?: number;
  bedrooms?: number;
  bathrooms?: number;
  page?: number;
  limit?: number;
  sort?: "recent" | "price_asc" | "price_desc" | "views";
}

export type CreateListingInput = Omit<
  Listing,
  "id" | "slug" | "views" | "created_at" | "updated_at" | "profiles"
>;

export type UpdateListingInput = Partial<
  Omit<Listing, "id" | "agent_id" | "slug" | "views" | "created_at" | "updated_at" | "profiles">
>;

export interface CreateLeadInput {
  listing_id?: string;
  agent_id: string;
  name: string;
  email: string;
  phone?: string;
  message: string;
  source?: string;
}

export interface LeadFilters {
  status?: LeadStatus;
  read?: boolean;
  listing_id?: string;
  limit?: number;
  offset?: number;
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  thisMonth: number;
  lastMonth: number;
  conversionRate: number;
}
