// Server-only — do NOT import from client components.
// Uses the cloudinary Node.js SDK (requires fs).

import { v2 as cloudinary } from "cloudinary";
import { getThumbnailUrl, getMediumUrl, getLargeUrl } from "./cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export async function deleteCloudinaryImage(publicId: string): Promise<void> {
  const result = await cloudinary.uploader.destroy(publicId);
  if (result.result !== "ok" && result.result !== "not found") {
    throw new Error(
      `Cloudinary delete failed for ${publicId}: ${result.result}`
    );
  }
}

export async function uploadListingImage(
  source: string | Buffer,
  folder = "listings"
): Promise<{
  public_id: string;
  thumbnail_url: string;
  medium_url: string;
  large_url: string;
}> {
  const uploaded = await cloudinary.uploader.upload(
    typeof source === "string"
      ? source
      : `data:image/webp;base64,${source.toString("base64")}`,
    {
      folder,
      resource_type: "image",
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    }
  );

  return {
    public_id: uploaded.public_id,
    thumbnail_url: getThumbnailUrl(uploaded.public_id),
    medium_url: getMediumUrl(uploaded.public_id),
    large_url: getLargeUrl(uploaded.public_id),
  };
}
