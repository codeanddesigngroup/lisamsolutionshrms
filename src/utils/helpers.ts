/**
 * Helper to get the correct path for static assets in the public directory.
 * Similar to Laravel's asset() helper.
 */
export const asset = (path: string): string => {
  if (!path) return '';
  // Ensure the path starts with a forward slash
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  // You can easily prepend a CDN URL here in the future if needed
  // Example: return `${process.env.NEXT_PUBLIC_ASSET_URL}${cleanPath}`;
  
  return cleanPath;
};

/**
 * Helper specifically for user uploads.
 * Maps to /user-uploads/...
 */
export const userUpload = (path: string): string => {
  if (!path) return '';
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return asset(`user-uploads/${cleanPath}`);
};

/**
 * Helper for image paths in the /img directory.
 */
export const imgAsset = (path: string): string => {
  if (!path) return '';
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return asset(`img/${cleanPath}`);
};
