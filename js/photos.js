// ══════════════════════════════════════════════════════════════════════
// PHOTOS — capture pipeline: downscale + upload to Storage
//
// iPhone photos are 2-4 MB raw and ~3-6 MB as base64. localStorage caps
// around 5 MB per origin, so storing raw photos there overflows on the
// first capture. Every photo passes through downscalePhoto() before it
// touches storage of any kind. Result: ~150 KB JPEGs at 1280px max edge,
// indistinguishable from the original on a phone screen.
//
// captureAndUpload() also pushes the result into Supabase Storage and
// returns { path, url, blob } — `url` is a public URL ready for <img>.
// ══════════════════════════════════════════════════════════════════════

const PHOTO_DEFAULTS = { maxEdge: 1280, quality: 0.82 };

async function downscalePhoto(file, opts = {}) {
  const { maxEdge, quality } = { ...PHOTO_DEFAULTS, ...opts };
  // imageOrientation: 'from-image' applies EXIF rotation automatically.
  // Without this, portrait iPhone photos render sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const ratio  = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width  * ratio));
  const h = Math.max(1, Math.round(bitmap.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));
  if (!blob) throw new Error('Photo encoding failed');
  return blob;
}

// Downscale + upload. Returns { path, url, blob }.
async function captureAndUpload(file, { kind = 'sightings' } = {}) {
  const blob = await downscalePhoto(file);
  const { path, url } = await DB.storage.uploadPhoto(blob, { kind });
  return { path, url, blob };
}

window.Photos = { downscale: downscalePhoto, captureAndUpload };
