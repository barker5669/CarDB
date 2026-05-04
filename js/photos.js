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
  // Decode the file. createImageBitmap is the fast path, but iOS Safari
  // before 17 throws on the imageOrientation option, and several mobile
  // browsers fail outright on HEIC or large iPhone-camera files. Fall
  // back to <img> + ObjectURL — that path delegates decoding to the OS,
  // which on iOS handles HEIC natively.
  let drawSrc, width, height, urlToRevoke = null;
  try {
    drawSrc = await createImageBitmap(file, { imageOrientation: 'from-image' });
    width = drawSrc.width; height = drawSrc.height;
  } catch {
    try {
      drawSrc = await createImageBitmap(file);
      width = drawSrc.width; height = drawSrc.height;
    } catch {
      urlToRevoke = URL.createObjectURL(file);
      drawSrc = await new Promise((resolve, reject) => {
        const img = new Image();
        img.onload  = () => resolve(img);
        img.onerror = () => reject(new Error('Could not decode photo (' + (file.type || 'unknown type') + ')'));
        img.src = urlToRevoke;
      });
      width = drawSrc.naturalWidth; height = drawSrc.naturalHeight;
    }
  }

  try {
    const ratio = Math.min(1, maxEdge / Math.max(width, height));
    const w = Math.max(1, Math.round(width  * ratio));
    const h = Math.max(1, Math.round(height * ratio));
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(drawSrc, 0, 0, w, h);
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', quality));
    if (!blob) throw new Error('Photo encoding failed');
    return blob;
  } finally {
    if (drawSrc && drawSrc.close) drawSrc.close();
    if (urlToRevoke) URL.revokeObjectURL(urlToRevoke);
  }
}

// Downscale + upload. Returns { path, url, blob }.
async function captureAndUpload(file, { kind = 'sightings' } = {}) {
  const blob = await downscalePhoto(file);
  const { path, url } = await DB.storage.uploadPhoto(blob, { kind });
  return { path, url, blob };
}

window.Photos = { downscale: downscalePhoto, captureAndUpload };
