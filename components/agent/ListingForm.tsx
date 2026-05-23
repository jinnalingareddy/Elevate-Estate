"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { GripVertical, Loader2, MapPin, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/providers/ToastProvider";
import { CityAutocomplete } from "@/components/agent/CityAutocomplete";
import { cn } from "@/lib/utils";
import { usePlanConfig } from "@/lib/plan-config-context";
import { searchLocations, type LocationSuggestion } from "@/lib/mexico-locations";
import { lookupPostalCode, prewarmPostalLookup } from "@/lib/postal-lookup";
import type { Listing, ListingImage, PlanType } from "@/lib/supabase/types";

// ─── Lazy-loaded sub-components ───────────────────────────────────────────────

const LocationPicker = dynamic(
  () =>
    import("./LocationPicker").then((m) => ({ default: m.LocationPicker })),
  {
    ssr: false,
    loading: () => (
      <div className="h-52 rounded-xl bg-slate-100 dark:bg-slate-700 animate-pulse" />
    ),
  }
);

const PhotoUploadWidget = dynamic(
  () =>
    import("./PhotoUploadWidget").then((m) => ({
      default: m.PhotoUploadWidget,
    })),
  { ssr: false }
);

// ─── Constants ────────────────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: "house", label: "Casa" },
  { value: "apartment", label: "Departamento" },
  { value: "condo", label: "Condominio" },
  { value: "land", label: "Terreno" },
  { value: "commercial", label: "Comercial" },
] as const;

const BATH_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 6, 7, 8];

const AMENITIES = [
  "Alberca Infinita",
  "Gym",
  "Seguridad 24h",
  "Jardín",
  "Terraza",
  "Elevador",
  "Bodega",
  "Vista al mar",
  "Área de juegos",
  "Salón de eventos",
  "Spa",
  "Estudio",
];

const CURRENT_YEAR = new Date().getFullYear();

// ─── Schema ───────────────────────────────────────────────────────────────────

function optionalNum(min = 0, max?: number) {
  let base = z.number({ invalid_type_error: "Debe ser un número" }).min(min);
  if (max !== undefined) base = base.max(max);
  return z.preprocess(
    (v) =>
      v === "" || v === null || v === undefined || Number.isNaN(v)
        ? undefined
        : Number(v),
    base.optional()
  );
}

const schema = z.object({
  // Información Básica
  title: z.string().min(1, "El título es requerido").max(100),
  description: z.string().min(1, "La descripción es requerida").max(2000),
  property_type: z.enum(["house", "apartment", "condo", "land", "commercial"]),
  status: z.enum(["draft", "active", "sold"]),
  listing_type: z.enum(["for_sale", "for_rent", "both"]).default("for_sale"),

  // Precio
  price: z.coerce
    .number({ invalid_type_error: "Ingresa un precio válido" })
    .min(1, "El precio es requerido"),
  maintenance_fee: optionalNum(0),

  // Detalles
  bedrooms: optionalNum(0, 20),
  bathrooms: optionalNum(0),
  total_area: optionalNum(0),
  parking_spots: optionalNum(0),
  year_built: optionalNum(1900, CURRENT_YEAR),

  // Ubicación
  city: z.string().min(1, "La ciudad es requerida"),
  address: z.string().optional(),
  calle_numero: z.string().min(1, "La calle y número son requeridos").max(300),
  numero_interior: z.string().max(50).optional(),
  postal_code: z.string().regex(/^\d{5}$/, "El código postal debe tener 5 dígitos"),
  neighborhood: z.string().min(1, "La colonia es requerida").max(200),
  alcaldia_municipio: z.string().min(1, "La alcaldía/municipio es requerida").max(200),
  estado: z.string().min(1, "El estado es requerido").max(100),
  referencias: z.string().max(500).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),

  // Tour Virtual
  virtual_tour_url: z
    .string()
    .url("URL inválida")
    .optional()
    .or(z.literal("")),

  // Amenidades
  amenities: z.array(z.string()).default([]),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ListingFormProps {
  mode: "create" | "edit";
  initialData?: Listing;
  agentId: string;
  agentPlan: PlanType;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
      {children}
    </h3>
  );
}

function FieldLabel({
  htmlFor,
  children,
  required,
}: {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
    >
      {children}
      {required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p role="alert" className="text-xs text-red-500 dark:text-red-400 mt-1">
      {message}
    </p>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  const over = value.length > max;
  return (
    <p
      className={cn(
        "text-xs text-right mt-1",
        over
          ? "text-red-500 dark:text-red-400"
          : "text-slate-400 dark:text-slate-500"
      )}
    >
      {value.length}/{max}
    </p>
  );
}

// ─── Photo grid with drag-to-reorder ─────────────────────────────────────────

function PhotoGrid({
  photos,
  onReorder,
  onDelete,
}: {
  photos: ListingImage[];
  onReorder: (photos: ListingImage[]) => void;
  onDelete: (publicId: string) => void;
}) {
  const dragIndex = useRef<number | null>(null);

  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">
      {photos.map((photo, idx) => (
        <div
          key={photo.public_id}
          draggable
          onDragStart={() => {
            dragIndex.current = idx;
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            const from = dragIndex.current;
            if (from === null || from === idx) return;
            const next = [...photos];
            const [moved] = next.splice(from, 1);
            next.splice(idx, 0, moved);
            onReorder(next);
            dragIndex.current = null;
          }}
          className="group relative aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-gold-400 transition-colors cursor-grab active:cursor-grabbing"
        >
          <Image
            src={photo.thumbnail_url}
            alt=""
            fill
            sizes="120px"
            className="object-cover"
          />

          {/* Foto principal label */}
          {idx === 0 && (
            <div className="absolute bottom-0 left-0 right-0 bg-gold-500/90 text-white text-[10px] font-semibold text-center py-0.5">
              Foto principal
            </div>
          )}

          {/* Drag handle */}
          <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="h-4 w-4 text-white drop-shadow" />
          </div>

          {/* Delete button */}
          <button
            type="button"
            onClick={() => onDelete(photo.public_id)}
            className={cn(
              "absolute top-1 right-1 p-1 rounded-full",
              "bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity",
              "hover:bg-red-600"
            )}
            aria-label="Eliminar foto"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── ListingForm ──────────────────────────────────────────────────────────────

export function ListingForm({
  mode,
  initialData,
  agentId,
  agentPlan,
}: ListingFormProps) {
  const router = useRouter();
  const { addToast } = useToast();
  const [photos, setPhotos] = useState<ListingImage[]>(
    initialData?.images ?? []
  );
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // CP lookup
  const [cpLoading, setCpLoading] = useState(false);
  const [cpColonias, setCpColonias] = useState<string[]>([]);
  // Street autocomplete
  const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
  const [showStreetSuggestions, setShowStreetSuggestions] = useState(false);
  const streetDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Colonia manual autocomplete (fallback when CP not found)
  const [coloniaSuggestions, setColoniaSuggestions] = useState<LocationSuggestion[]>([]);
  const [showColoniaSuggestions, setShowColoniaSuggestions] = useState(false);
  const coloniaDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoGeocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { prewarmPostalLookup(); }, []);

  const { plans } = usePlanConfig();
  const maxPhotos = agentPlan === "elite" ? 30 : agentPlan === "pro" ? 20 : 10;
  const planLimit = plans[agentPlan].listingLimit;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: initialData
      ? {
          title: initialData.title,
          description: initialData.description,
          property_type: initialData.property_type,
          status: initialData.status === "pending" ? "draft" : initialData.status,
          listing_type: initialData.listing_type ?? "for_sale",
          price: initialData.price,
          maintenance_fee: initialData.maintenance_fee ?? undefined,
          bedrooms: initialData.bedrooms ?? undefined,
          bathrooms: initialData.bathrooms ?? undefined,
          total_area: initialData.total_area ?? undefined,
          parking_spots: initialData.parking_spots ?? undefined,
          year_built: initialData.year_built ?? undefined,
          city: initialData.city,
          address: initialData.address,
          calle_numero: initialData.calle_numero ?? "",
          numero_interior: initialData.numero_interior ?? "",
          postal_code: initialData.postal_code ?? "",
          neighborhood: initialData.neighborhood ?? "",
          alcaldia_municipio: initialData.alcaldia_municipio ?? "",
          estado: initialData.state ?? "",
          referencias: initialData.referencias ?? "",
          lat: initialData.lat ?? undefined,
          lng: initialData.lng ?? undefined,
          virtual_tour_url: initialData.virtual_tour_url ?? "",
          amenities: initialData.amenities,
        }
      : {
          property_type: "house",
          status: "draft",
          listing_type: "for_sale" as const,
          amenities: [],
        },
  });

  const titleValue = watch("title") ?? "";
  const descValue = watch("description") ?? "";
  const lat = watch("lat") ?? null;
  const lng = watch("lng") ?? null;
  const amenitiesValue = watch("amenities") ?? [];
  const coloniaValue = watch("neighborhood") ?? "";
  const postalCodeValue = watch("postal_code") ?? "";
  const calleValue = watch("calle_numero") ?? "";
  const cityValue = watch("city") ?? "";

  // Auto-geocode when all required address fields are filled and no coordinates exist yet
  useEffect(() => {
    if (!calleValue || !coloniaValue || !cityValue || lat !== null || lng !== null) return;
    if (autoGeocodeTimer.current) clearTimeout(autoGeocodeTimer.current);
    autoGeocodeTimer.current = setTimeout(() => { void geocodeAddress(); }, 1500);
    return () => { if (autoGeocodeTimer.current) clearTimeout(autoGeocodeTimer.current); };
  // geocodeAddress reads form values via watch() internally — not a dependency
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [calleValue, coloniaValue, cityValue]);

  // ── Geocode address ────────────────────────────────────────────────────────
  async function geocodeAddress() {
    const city = watch("city");
    const calle = watch("calle_numero");
    const colonia = watch("neighborhood");
    const query = [calle, colonia, city].filter(Boolean).join(", ");
    if (!query) return;

    setIsGeocoding(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`,
        { headers: { "Accept-Language": "es" } }
      );
      const data = await res.json();
      if (data[0]) {
        setValue("lat", parseFloat(data[0].lat));
        setValue("lng", parseFloat(data[0].lon));
      } else {
        addToast("Sin resultados", {
          description: "No se encontraron coordenadas para esa dirección.",
          variant: "warning",
        });
      }
    } catch {
      addToast("Error", {
        description: "No se pudo geocodificar. Intenta de nuevo.",
        variant: "error",
      });
    } finally {
      setIsGeocoding(false);
    }
  }

  // ── Street autocomplete (Nominatim) ───────────────────────────────────────
  function handleStreetInput(value: string) {
    setValue("calle_numero", value);
    if (streetDebounceRef.current) clearTimeout(streetDebounceRef.current);
    if (value.length < 4) {
      setStreetSuggestions([]);
      setShowStreetSuggestions(false);
      return;
    }
    streetDebounceRef.current = setTimeout(async () => {
      const municipio = watch("alcaldia_municipio");
      const query = municipio ? `${value}, ${municipio}, Mexico` : `${value}, Mexico`;
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5&addressdetails=1&countrycodes=mx`,
          { headers: { "Accept-Language": "es" } }
        );
        const data = await res.json();
        const streets: string[] = [];
        const seen = new Set<string>();
        for (const r of (data as { address?: { road?: string }; display_name?: string }[])) {
          const road = r.address?.road ?? r.display_name?.split(",")[0]?.trim();
          if (road && !seen.has(road)) {
            seen.add(road);
            streets.push(road);
          }
        }
        setStreetSuggestions(streets);
        setShowStreetSuggestions(streets.length > 0);
      } catch {
        setStreetSuggestions([]);
      }
    }, 500);
  }

  // ── CP lookup ─────────────────────────────────────────────────────────────
  async function handlePostalCodeChange(value: string) {
    const filtered = value.replace(/\D/g, "").slice(0, 5);
    setValue("postal_code", filtered, { shouldValidate: filtered.length === 5 });
    if (filtered.length === 0) {
      setCpColonias([]);
      setValue("alcaldia_municipio", "", { shouldValidate: false });
      setValue("estado", "", { shouldValidate: false });
      setValue("city", "", { shouldValidate: false });
      setValue("neighborhood", "", { shouldValidate: false });
      return;
    }
    if (filtered.length !== 5) return;
    setCpLoading(true);
    try {
      const cpData = await lookupPostalCode(filtered);
      if (!cpData) return;
      setCpColonias(cpData.colonias ?? []);
      setValue("alcaldia_municipio", cpData.municipio, { shouldValidate: true });
      setValue("estado", cpData.estado, { shouldValidate: true });
      setValue("city", cpData.ciudad, { shouldValidate: true });
      if (!watch("neighborhood") && cpData.colonias?.length > 0) {
        setValue("neighborhood", cpData.colonias[0], { shouldValidate: true });
      }
    } finally {
      setCpLoading(false);
    }
  }

  // ── Colonia autocomplete (manual fallback when CP not found) ──────────────
  function handleColoniaInput(value: string) {
    setValue("neighborhood", value, { shouldValidate: false });
    if (coloniaDebounceRef.current) clearTimeout(coloniaDebounceRef.current);
    if (cpColonias.length > 0) {
      // CP lookup already populated colonias — don't show free-text suggestions
      setColoniaSuggestions([]);
      setShowColoniaSuggestions(false);
      return;
    }
    if (value.length < 2) {
      setColoniaSuggestions([]);
      setShowColoniaSuggestions(false);
      return;
    }
    coloniaDebounceRef.current = setTimeout(() => {
      const results = searchLocations(value, 6).filter((s) => s.type === "colonia");
      setColoniaSuggestions(results);
      setShowColoniaSuggestions(results.length > 0);
    }, 200);
  }

  function selectColonia(s: LocationSuggestion) {
    setValue("neighborhood", s.colonia ?? s.municipio, { shouldValidate: true });
    setValue("alcaldia_municipio", s.municipio, { shouldValidate: true });
    setValue("estado", s.estado, { shouldValidate: true });
    if (!watch("city")) {
      setValue("city", s.municipio, { shouldValidate: true });
    }
    setColoniaSuggestions([]);
    setShowColoniaSuggestions(false);
  }

  // ── Photo handlers ─────────────────────────────────────────────────────────
  function handlePhotoUpload(image: ListingImage) {
    setPhotos((prev) => [...prev, image]);
  }

  async function handlePhotoDelete(publicId: string) {
    setPhotos((prev) => prev.filter((p) => p.public_id !== publicId));
    try {
      await fetch("/api/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicId }),
      });
    } catch {
      // Silent — photo removed from UI, server cleanup is best-effort
    }
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  async function onSubmit(data: FormValues) {
    setSubmitting(true);
    try {
      const composedAddress = [data.calle_numero, data.numero_interior]
        .filter(Boolean)
        .join(" Int. ");

      const payload = {
        ...data,
        address: composedAddress || data.address || "",
        agent_id: agentId,
        images: photos,
        currency: "MXN",
        neighborhood: data.neighborhood,
        state: data.estado,
        country: "México",
        featured: initialData?.featured ?? false,
        video_url: null,
      };

      const url =
        mode === "edit" && initialData
          ? `/api/properties/${initialData.id}`
          : "/api/properties";
      const method = mode === "edit" ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Error al guardar");

      addToast(
        data.status === "active" ? "Propiedad publicada" : "Borrador guardado",
        {
          description:
            data.status === "active"
              ? "Tu propiedad está visible al público."
              : "Tu borrador se ha guardado correctamente.",
          variant: "success",
        }
      );

      router.push("/agent/listings");
    } catch {
      addToast("Error al guardar", {
        description: "Revisa los campos e intenta de nuevo.",
        variant: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  function handleSaveDraft() {
    setValue("status", "draft");
    void handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])();
  }

  async function handlePublish() {
    setValue("status", "active");
    if (!lat && !lng) await geocodeAddress();
    void handleSubmit(onSubmit as Parameters<typeof handleSubmit>[0])();
  }

  function toggleAmenity(name: string) {
    const current = amenitiesValue;
    if (current.includes(name)) {
      setValue(
        "amenities",
        current.filter((a) => a !== name)
      );
    } else {
      setValue("amenities", [...current, name]);
    }
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={(e) => e.preventDefault()} noValidate className="space-y-8">
      {/* ── Información Básica ─────────────────────────────────────────── */}
      <section>
        <SectionHeading>Información Básica</SectionHeading>
        <div className="space-y-4">
          {/* Título */}
          <div>
            <FieldLabel htmlFor="title" required>
              Título
            </FieldLabel>
            <input
              id="title"
              type="text"
              maxLength={105}
              placeholder="Ej. Casa moderna con jardín en Polanco"
              className={inputCls(!!errors.title)}
              {...register("title")}
            />
            <div className="flex items-start justify-between">
              <FieldError message={errors.title?.message} />
              <CharCount value={titleValue} max={100} />
            </div>
          </div>

          {/* Descripción */}
          <div>
            <FieldLabel htmlFor="description" required>
              Descripción
            </FieldLabel>
            <textarea
              id="description"
              rows={5}
              maxLength={2050}
              placeholder="Describe las características principales de la propiedad..."
              className={cn(inputCls(!!errors.description), "resize-none")}
              {...register("description")}
            />
            <div className="flex items-start justify-between">
              <FieldError message={errors.description?.message} />
              <CharCount value={descValue} max={2000} />
            </div>
          </div>

          {/* Tipo + Operación + Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <FieldLabel htmlFor="property_type" required>
                Tipo de Propiedad
              </FieldLabel>
              <select
                id="property_type"
                className={inputCls(!!errors.property_type)}
                {...register("property_type")}
              >
                {PROPERTY_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>
                    {pt.label}
                  </option>
                ))}
              </select>
              <FieldError message={errors.property_type?.message} />
            </div>

            <div>
              <FieldLabel htmlFor="listing_type" required>
                Operación
              </FieldLabel>
              <select
                id="listing_type"
                className={inputCls(!!errors.listing_type)}
                {...register("listing_type")}
              >
                <option value="for_sale">En Venta</option>
                <option value="for_rent">En Renta</option>
                <option value="both">Venta y Renta</option>
              </select>
              <FieldError message={errors.listing_type?.message} />
            </div>

            <div>
              <FieldLabel htmlFor="status" required>
                Estado de la publicación
              </FieldLabel>
              <select
                id="status"
                className={inputCls(!!errors.status)}
                {...register("status")}
              >
                <option value="draft">Borrador</option>
                <option value="active">Activo</option>
                <option value="sold">Vendido</option>
              </select>
              <FieldError message={errors.status?.message} />
            </div>
          </div>
        </div>
      </section>

      {/* ── Precio ────────────────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Precio</SectionHeading>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <FieldLabel htmlFor="price" required>
              Precio (MXN)
            </FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                $
              </span>
              <input
                id="price"
                type="number"
                min={0}
                placeholder="0"
                className={cn(inputCls(!!errors.price), "pl-6")}
                {...register("price")}
              />
            </div>
            <FieldError message={errors.price?.message} />
          </div>

          <div>
            <FieldLabel htmlFor="maintenance_fee">
              Cuota de mantenimiento (MXN / mes)
            </FieldLabel>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none">
                $
              </span>
              <input
                id="maintenance_fee"
                type="number"
                min={0}
                placeholder="Opcional"
                className={cn(inputCls(false), "pl-6")}
                {...register("maintenance_fee")}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Detalles ───────────────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Detalles</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Recámaras */}
          <div>
            <FieldLabel htmlFor="bedrooms">Recámaras</FieldLabel>
            <input
              id="bedrooms"
              type="number"
              min={0}
              max={20}
              placeholder="—"
              className={inputCls(false)}
              {...register("bedrooms")}
            />
          </div>

          {/* Baños */}
          <div>
            <FieldLabel htmlFor="bathrooms">Baños</FieldLabel>
            <select
              id="bathrooms"
              className={inputCls(false)}
              {...register("bathrooms")}
            >
              <option value="">—</option>
              {BATH_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>

          {/* Superficie */}
          <div>
            <FieldLabel htmlFor="total_area">Superficie m²</FieldLabel>
            <input
              id="total_area"
              type="number"
              min={0}
              placeholder="—"
              className={inputCls(false)}
              {...register("total_area")}
            />
          </div>

          {/* Cajones */}
          <div>
            <FieldLabel htmlFor="parking_spots">Estacionamiento</FieldLabel>
            <input
              id="parking_spots"
              type="number"
              min={0}
              placeholder="—"
              className={inputCls(false)}
              {...register("parking_spots")}
            />
          </div>

          {/* Año */}
          <div>
            <FieldLabel htmlFor="year_built">Año construc.</FieldLabel>
            <input
              id="year_built"
              type="number"
              min={1900}
              max={CURRENT_YEAR}
              placeholder={String(CURRENT_YEAR)}
              className={inputCls(false)}
              {...register("year_built")}
            />
          </div>
        </div>
      </section>

      {/* ── Dirección Completa ────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Dirección Completa</SectionHeading>
        <div className="space-y-4">

          {/* 1 · Calle y Número — with Nominatim street autocomplete */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <FieldLabel htmlFor="calle_numero" required>
                Calle y Número
              </FieldLabel>
              <input
                id="calle_numero"
                type="text"
                autoComplete="off"
                placeholder="Ej. Av. Insurgentes Sur 1079"
                value={watch("calle_numero") ?? ""}
                onChange={(e) => handleStreetInput(e.target.value)}
                onBlur={() => {
                  setTimeout(() => setShowStreetSuggestions(false), 150);
                  void trigger("calle_numero");
                }}
                className={inputCls(!!errors.calle_numero)}
              />
              <FieldError message={errors.calle_numero?.message} />
              {showStreetSuggestions && streetSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {streetSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setValue("calle_numero", s, { shouldValidate: true });
                        setShowStreetSuggestions(false);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-gold-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* 2 · Número Interior */}
            <div>
              <FieldLabel htmlFor="numero_interior">Número Interior</FieldLabel>
              <input
                id="numero_interior"
                type="text"
                placeholder="Ej. Depto. 4B (opcional)"
                className={inputCls(false)}
                {...register("numero_interior")}
              />
            </div>
          </div>

          {/* 3 · Código Postal — triggers auto-fill of fields below */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="postal_code" required>
                Código Postal (CP)
              </FieldLabel>
              <div className="relative">
                <input
                  id="postal_code"
                  type="text"
                  inputMode="numeric"
                  maxLength={5}
                  placeholder="Ej. 06600"
                  value={postalCodeValue}
                  onChange={(e) => void handlePostalCodeChange(e.target.value)}
                  className={inputCls(!!errors.postal_code)}
                />
                {cpLoading && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 animate-spin" aria-hidden />
                )}
              </div>
              <FieldError message={errors.postal_code?.message} />
              {postalCodeValue.length === 5 && !cpLoading && cpColonias.length === 0 && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                  CP no encontrado — llena los campos manualmente.
                </p>
              )}
            </div>
          </div>

          {/* 4 · Colonia + Alcaldía/Municipio — side by side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="relative">
              <FieldLabel htmlFor="neighborhood" required>
                Colonia
              </FieldLabel>
              {cpColonias.length > 0 ? (
                <select
                  id="neighborhood"
                  value={coloniaValue}
                  onChange={(e) => setValue("neighborhood", e.target.value, { shouldValidate: true })}
                  onBlur={() => void trigger("neighborhood")}
                  className={inputCls(!!errors.neighborhood)}
                >
                  <option value="">Selecciona una colonia</option>
                  {cpColonias.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              ) : (
                <input
                  id="neighborhood"
                  type="text"
                  autoComplete="off"
                  placeholder="Ej. Roma Norte"
                  value={coloniaValue}
                  onChange={(e) => handleColoniaInput(e.target.value)}
                  onBlur={() => {
                    setTimeout(() => setShowColoniaSuggestions(false), 150);
                    void trigger("neighborhood");
                  }}
                  className={inputCls(!!errors.neighborhood)}
                />
              )}
              <FieldError message={errors.neighborhood?.message} />
              {showColoniaSuggestions && coloniaSuggestions.length > 0 && (
                <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                  {coloniaSuggestions.map((s) => (
                    <button
                      key={`${s.colonia}-${s.municipio}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        selectColonia(s);
                      }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-left text-slate-700 dark:text-slate-300 hover:bg-gold-50 dark:hover:bg-slate-700 transition-colors"
                    >
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" aria-hidden />
                      <span className="flex-1">{s.display}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <FieldLabel htmlFor="alcaldia_municipio" required>
                Alcaldía / Municipio
              </FieldLabel>
              <input
                id="alcaldia_municipio"
                type="text"
                placeholder="Ej. Cuauhtémoc"
                className={inputCls(!!errors.alcaldia_municipio)}
                {...register("alcaldia_municipio")}
              />
              <FieldError message={errors.alcaldia_municipio?.message} />
            </div>
          </div>

          {/* 5 · Ciudad + Estado — side by side, disabled when CP auto-filled */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <FieldLabel htmlFor="city" required>
                Ciudad
              </FieldLabel>
              <CityAutocomplete
                id="city"
                value={watch("city") ?? ""}
                onChange={(v) => setValue("city", v, { shouldValidate: true })}
                onBlur={() => trigger("city")}
                error={!!errors.city}
                disabled={cpColonias.length > 0}
              />
              <FieldError message={errors.city?.message} />
            </div>

            <div>
              <FieldLabel htmlFor="estado" required>
                Estado
              </FieldLabel>
              <input
                id="estado"
                type="text"
                placeholder="Ej. Ciudad de México"
                disabled={cpColonias.length > 0}
                className={inputCls(!!errors.estado, cpColonias.length > 0)}
                {...register("estado")}
              />
              <FieldError message={errors.estado?.message} />
            </div>
          </div>

          {/* 8 · Referencias */}
          <div>
            <FieldLabel htmlFor="referencias">Calles Aledañas / Referencias</FieldLabel>
            <input
              id="referencias"
              type="text"
              placeholder="Ej. Entre Orizaba y Sonora (opcional)"
              className={inputCls(false)}
              {...register("referencias")}
            />
          </div>

          {/* 9 · Coordinates + geocode + map */}
          <div>
            <div className="flex items-center gap-3 mb-2 flex-wrap">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Coordenadas
              </p>
              <button
                type="button"
                onClick={geocodeAddress}
                disabled={isGeocoding}
                className={cn(
                  "flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors",
                  "border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400",
                  "hover:border-gold-500 hover:text-gold-700 dark:hover:text-gold-400",
                  "disabled:opacity-50 disabled:pointer-events-none"
                )}
              >
                {isGeocoding ? (
                  <Loader2 className="h-3 w-3 animate-spin" aria-hidden />
                ) : (
                  <MapPin className="h-3 w-3" aria-hidden />
                )}
                Buscar coordenadas
              </button>
            </div>

            <div className="flex gap-3 mb-3">
              <input
                type="text"
                readOnly
                value={lat !== null ? lat.toFixed(6) : ""}
                placeholder="Lat"
                aria-label="Latitud"
                className={cn(inputCls(false), "bg-slate-50 dark:bg-slate-900 text-slate-500 cursor-default text-xs")}
              />
              <input
                type="text"
                readOnly
                value={lng !== null ? lng.toFixed(6) : ""}
                placeholder="Lng"
                aria-label="Longitud"
                className={cn(inputCls(false), "bg-slate-50 dark:bg-slate-900 text-slate-500 cursor-default text-xs")}
              />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Haz clic en el mapa o arrastra el marcador para ajustar la ubicación.
            </p>

            <LocationPicker
              lat={lat}
              lng={lng}
              onChange={(newLat, newLng) => {
                setValue("lat", newLat);
                setValue("lng", newLng);
              }}
            />
          </div>
        </div>
      </section>

      {/* ── Tour Virtual ───────────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Tour Virtual</SectionHeading>
        <div>
          <FieldLabel htmlFor="virtual_tour_url">
            URL del Tour Virtual (YouTube o Matterport)
          </FieldLabel>
          <input
            id="virtual_tour_url"
            type="url"
            placeholder="https://my.matterport.com/show/?m=..."
            className={inputCls(!!errors.virtual_tour_url)}
            {...register("virtual_tour_url")}
          />
          <FieldError message={errors.virtual_tour_url?.message} />
        </div>
      </section>

      {/* ── Amenidades ─────────────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Amenidades</SectionHeading>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {AMENITIES.map((name) => {
            const checked = amenitiesValue.includes(name);
            return (
              <label
                key={name}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl border text-sm cursor-pointer transition-colors select-none",
                  checked
                    ? "border-gold-500 bg-gold-50 text-gold-700 dark:bg-gold-900/20 dark:text-gold-300 dark:border-gold-400"
                    : "border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-gold-300 dark:hover:border-gold-600"
                )}
              >
                <span
                  className={cn(
                    "h-4 w-4 shrink-0 rounded border-2 flex items-center justify-center transition-colors",
                    checked
                      ? "border-gold-500 bg-gold-500 dark:border-gold-400 dark:bg-gold-400"
                      : "border-slate-300 dark:border-slate-500"
                  )}
                  aria-hidden
                >
                  {checked && (
                    <svg
                      viewBox="0 0 12 10"
                      className="h-2.5 w-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <polyline points="1 5 4 9 11 1" />
                    </svg>
                  )}
                </span>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() => toggleAmenity(name)}
                />
                {name}
              </label>
            );
          })}
        </div>
      </section>

      {/* ── Fotos ──────────────────────────────────────────────────────────── */}
      <section>
        <SectionHeading>Fotos</SectionHeading>
        <div>
          <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {photos.length}/{maxPhotos} foto{photos.length !== 1 ? "s" : ""}
              {" "}subida{photos.length !== 1 ? "s" : ""}
            </p>
            <PhotoUploadWidget
              onUpload={handlePhotoUpload}
              disabled={photos.length >= maxPhotos}
              remainingSlots={maxPhotos - photos.length}
            />
          </div>

          <PhotoGrid
            photos={photos}
            onReorder={setPhotos}
            onDelete={handlePhotoDelete}
          />

          {photos.length === 0 && (
            <div className="mt-2 flex items-center justify-center h-32 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-400 dark:text-slate-500">
                No hay fotos. Usa el botón de arriba para subir imágenes.
              </p>
            </div>
          )}
        </div>
      </section>

      {/* ── Submit ─────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
        <Button
          type="button"
          variant="ghost"
          size="lg"
          loading={submitting}
          onClick={handleSaveDraft}
          disabled={submitting}
        >
          Guardar Borrador
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          loading={submitting}
          onClick={handlePublish}
          disabled={submitting}
        >
          Publicar Propiedad
        </Button>
      </div>
    </form>
  );
}

// ─── Shared input class helper ────────────────────────────────────────────────

function inputCls(hasError: boolean, disabled = false) {
  return cn(
    "w-full h-10 px-3 rounded-lg text-sm border transition-colors",
    "bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100",
    "placeholder:text-slate-400 dark:placeholder:text-slate-500",
    "focus:outline-none focus:ring-2 focus:ring-gold-500 focus:border-transparent",
    "disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 dark:disabled:bg-slate-700/50",
    hasError
      ? "border-red-500 dark:border-red-500"
      : "border-slate-300 dark:border-slate-600",
    disabled && "opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-700/50"
  );
}
