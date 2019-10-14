import { UPDATE } from "react-admin";

export const LISTING_FEATURE = "LISTING_FEATURE";
export const listingFeature = (resource, id, listing) => ({
  type: LISTING_FEATURE,
  payload: {
    id,
    data: {
      tags: { tags: [...(listing.tags.tags || []), "featured"] }
    }
  },
  meta: { fetch: UPDATE, resource, refresh: true }
});

export const LISTING_UNFEATURE = "LISTING_UNFEATURE";
export const listingUnfeature = (resource, id, listing) => ({
  type: LISTING_UNFEATURE,
  payload: {
    id,
    data: {
      tags: { tags: [...(listing.tags.tags || []).filter(x => x !== "featured")] }
    }
  },
  meta: { fetch: UPDATE, resource, refresh: true }
});
