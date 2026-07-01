/**
 * Avatar upload client (Sprint 2 / Epic E1.2).
 *
 * Keeps network + validation logic out of the React component (SRP).
 * Errors surface as thrown Error instances so callers can toast them.
 *
 * Mirror of the backend `AvatarStorageService` contract: same limits,
 * same allowed MIME types. Any client-side rejection is a UX optimization
 * — the backend remains the source of truth.
 */

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const AVATAR_ALLOWED_MIME = ['image/png', 'image/jpeg'] as const;

export interface AvatarUploadResult {
  success: boolean;
  message: string;
  avatar_url: string | null;
}

export function validateAvatarLocally(file: File): void {
  if (!AVATAR_ALLOWED_MIME.includes(file.type as (typeof AVATAR_ALLOWED_MIME)[number])) {
    throw new Error(
      `Unsupported image type '${file.type}'. Allowed: PNG, JPEG.`
    );
  }
  if (file.size > AVATAR_MAX_BYTES) {
    throw new Error(
      `Image is too large (${Math.round(file.size / 1024)} KB; max ${Math.round(
        AVATAR_MAX_BYTES / 1024
      )} KB).`
    );
  }
}

/**
 * Resize and re-encode an image file in-browser using Canvas.
 * Always outputs JPEG regardless of source format (safe for profile photos).
 * A phone selfie that is 8 MB raw becomes ~150 KB after this step.
 *
 * Falls back to the original file if the Canvas API is unavailable (SSR).
 */
export function compressAvatarImage(
  file: File,
  maxDimension = 1024,
  quality = 0.85
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (typeof document === 'undefined') {
      resolve(file);
      return;
    }
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas compression failed'));
        },
        'image/jpeg',
        quality
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not load image for compression'));
    };
    img.src = url;
  });
}

function graphqlHttpBase(): string {
  // Derive base from the GraphQL URL so dev / prod point at the same host.
  const gql = process.env.NEXT_PUBLIC_GRAPHQL_URL || 'http://localhost:8000/graphql';
  return gql.replace(/\/graphql\/?$/, '');
}

export async function uploadAvatar(
  file: File,
  accessToken: string
): Promise<AvatarUploadResult> {
  // Check MIME type before doing any compression work.
  if (!AVATAR_ALLOWED_MIME.includes(file.type as (typeof AVATAR_ALLOWED_MIME)[number])) {
    throw new Error(`Unsupported image type '${file.type}'. Allowed: PNG, JPEG.`);
  }

  // Compress in-browser: resize to ≤1024px + JPEG re-encode.
  let blob: Blob;
  try {
    blob = await compressAvatarImage(file);
  } catch {
    blob = file;
  }

  // Safety-net size check on the compressed result.
  if (blob.size > AVATAR_MAX_BYTES) {
    throw new Error(
      `Image is too large after compression (${Math.round(blob.size / 1024)} KB; max ${Math.round(
        AVATAR_MAX_BYTES / 1024
      )} KB).`
    );
  }

  const form = new FormData();
  form.append('file', blob, 'avatar.jpg');

  const resp = await fetch(`${graphqlHttpBase()}/api/profile/avatar`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  });

  let payload: AvatarUploadResult;
  try {
    payload = (await resp.json()) as AvatarUploadResult;
  } catch {
    throw new Error(`Upload failed (HTTP ${resp.status})`);
  }

  if (!resp.ok || !payload.success) {
    throw new Error(payload.message || `Upload failed (HTTP ${resp.status})`);
  }
  return payload;
}
