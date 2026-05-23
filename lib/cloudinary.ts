// Pure URL-building helpers — safe to import from both client and server.
// For server-only upload/delete, import from ./cloudinary-server.

export interface CloudinaryOptions {
  width?: number;
  height?: number;
  crop?: "fill" | "fit" | "limit" | "scale" | "pad" | "thumb";
  gravity?: "auto" | "face" | "center";
  quality?: number | "auto";
  format?: string | "auto";
}

export function getCloudinaryUrl(
  publicId: string,
  options: CloudinaryOptions = {}
): string {
  const {
    width,
    height,
    crop = "fill",
    gravity = "auto",
    quality = "auto",
    format = "auto",
  } = options;

  const transformations: string[] = [`f_${format}`, `q_${quality}`];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) {
    transformations.push(`c_${crop}`);
    transformations.push(`g_${gravity}`);
  }

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const transform = transformations.join(",");
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transform}/${publicId}`;
}

export function getThumbnailUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, { width: 400, height: 300, crop: "fill" });
}

export function getMediumUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, { width: 800, height: 600, crop: "fill" });
}

export function getLargeUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, { width: 1600, height: 1200, crop: "fill" });
}

export function getBlurDataUrl(publicId: string): string {
  return getCloudinaryUrl(publicId, {
    width: 10,
    height: 10,
    crop: "fill",
    quality: 30,
  });
}
