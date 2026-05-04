// ══════════════════════════════════════════════════════════════════════
// PHOTOBIN — local-only "save for later" bin for unassigned photos.
//
// Photos in the bin are stored on-device only (LocalPhotos under the
// pseudo-owner '__sortbin__'). When the user later assigns one to a
// car, the LocalPhotos entry is moved from the bin owner to the
// sighting owner — same blob, just a different owner id.
//
// Item shape (returned by list()):
//   { id, path, ts, location, url }
// ══════════════════════════════════════════════════════════════════════

const _BIN_OWNER = '__sortbin__';

const PhotoBin = {
  list() {
    return (typeof LocalPhotos !== 'undefined') ? LocalPhotos.list(_BIN_OWNER) : [];
  },

  count() { return this.list().length; },

  // Stash a freshly-captured camera blob for later assignment. Returns
  // the bin entry id.
  async add({ blob, location }) {
    if (!blob || typeof LocalPhotos === 'undefined') return null;
    const entry = await LocalPhotos.add(_BIN_OWNER, blob, { location: location || null });
    return entry.id;
  },

  // Drop a bin item — removes both the LocalPhotos entry and its
  // PhotoCache blob. Used for the "delete from bin" path.
  async remove(id) {
    if (typeof LocalPhotos === 'undefined') return;
    LocalPhotos.removeEntry(_BIN_OWNER, id, { withBlob: true });
  },

  // Move a bin item to belong to a sighting (or other owner). Keeps
  // the same blob — only the owner-id changes. Used by the sort-screen
  // attach flow.
  moveToOwner(id, newOwnerId) {
    if (typeof LocalPhotos === 'undefined') return null;
    return LocalPhotos.move(_BIN_OWNER, id, newOwnerId);
  },

  async clear() {
    if (typeof LocalPhotos === 'undefined') return;
    LocalPhotos.removeAll(_BIN_OWNER);
  },

  // No-op kept so existing call sites (auth.js afterSignIn) don't need
  // edits. The bin is purely local now — there's nothing to sync.
  async sync() { /* no-op */ },
};

window.PhotoBin = PhotoBin;
