"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Camera } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ListingImage } from "@/lib/supabase/types";

// ─── Cloudinary URL helpers (inlined to avoid server-side SDK import) ─────────

function cloudinaryUrl(publicId: string, w: number, h: number): string {
  const cloud = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
  return `https://res.cloudinary.com/${cloud}/image/upload/f_auto,q_auto,w_${w},h_${h},c_fill,g_auto/${publicId}`;
}

function buildImage(publicId: string): ListingImage {
  return {
    public_id: publicId,
    thumbnail_url: cloudinaryUrl(publicId, 400, 300),
    medium_url: cloudinaryUrl(publicId, 800, 600),
    large_url: cloudinaryUrl(publicId, 1600, 1200),
  };
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface PhotoUploadWidgetProps {
  onUpload: (image: ListingImage) => void;
  disabled?: boolean;
  remainingSlots?: number;
}

// ─── PhotoUploadWidget ────────────────────────────────────────────────────────

export function PhotoUploadWidget({
  onUpload,
  disabled = false,
  remainingSlots = 10,
}: PhotoUploadWidgetProps) {
  const preset =
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ??
    "estateelevate_unsigned";

  return (
    <CldUploadWidget
      uploadPreset={preset}
      options={{
        multiple: true,
        maxFiles: remainingSlots,
        resourceType: "image",
        folder: "listings",
        clientAllowedFormats: ["jpg", "jpeg", "png", "webp"],
        maxFileSize: 52_428_800, // 50 MB — accommodates raw DSLR JPEGs
        maxImageWidth: 4000,
        maxImageHeight: 3000,
      }}
      onSuccess={(result) => {
        const info = result.info as { public_id?: string } | null;
        if (info?.public_id) {
          onUpload(buildImage(info.public_id));
        }
      }}
    >
      {({ open }) => (
        <div className="flex flex-col items-start gap-1">
          <button
            type="button"
            onClick={() => open()}
            disabled={disabled || remainingSlots <= 0}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border-2 border-dashed transition-colors",
              disabled || remainingSlots <= 0
                ? "border-slate-200 dark:border-slate-700 text-slate-400 cursor-not-allowed"
                : "border-gold-300 dark:border-gold-600 text-gold-700 dark:text-gold-400 hover:bg-gold-50 dark:hover:bg-gold-900/20 cursor-pointer"
            )}
          >
            <Camera className="h-4 w-4 shrink-0" aria-hidden />
            {remainingSlots <= 0 ? "Límite de fotos alcanzado" : "Subir Fotos"}
          </button>
          {remainingSlots > 0 && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Las fotos se optimizan automáticamente antes de subirse
            </p>
          )}
        </div>
      )}
    </CldUploadWidget>
  );
}
