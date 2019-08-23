import { CREATE, UPDATE } from "react-admin";

function randomString(len) {
  const p = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  return [...Array(len)].reduce(a => a + p[~~(Math.random() * p.length)], "");
}

export const AVATAR_APPROVE_NEW = "AVATAR_APPROVE_NEW";
export const avatarApproveNew = avatar => ({
  type: AVATAR_APPROVE_NEW,
  payload: {
    data: {
      avatar_listing_sid: randomString(7),
      avatar_id: avatar.id,
      slug: avatar.slug,
      name: avatar.name,
      description: avatar.description,
      attributions: avatar.attributions,
      tags: { tags: [] },

      account_id: avatar.account,

      parent_avatar_listing_id: avatar.parent_avatar_listing_id,
      gltf_owned_file_id: avatar.gltf_owned_file_id,
      bin_owned_file_id: avatar.bin_owned_file_id,
      thumbnail_owned_file_id: avatar.thumbnail_owned_file_id,
      base_map_owned_file_id: avatar.base_map_owned_file_id,
      emissive_map_owned_file_id: avatar.emissive_map_owned_file_id,
      normal_map_owned_file_id: avatar.normal_map_owned_file_id,
      orm_map_owned_file_id: avatar.orm_map_owned_file_id,

      order: 10000, // Start at end of listings
      state: "active",
      inserted_at: new Date(),
      updated_at: new Date()
    }
  },
  meta: { fetch: CREATE, resource: "avatar_listings" }
});

export const AVATAR_APPROVE_EXISTING = "AVATAR_APPROVE_EXISTING";
export const avatarApproveExisting = avatar => ({
  type: AVATAR_APPROVE_EXISTING,
  payload: {
    id: avatar.avatar_listing_id,
    data: {
      name: avatar.name,
      description: avatar.description,
      attributions: avatar.attributions,

      account_id: avatar.account,

      parent_avatar_listing_id: avatar.parent_avatar_listing_id,
      gltf_owned_file_id: avatar.gltf_owned_file_id,
      bin_owned_file_id: avatar.bin_owned_file_id,
      thumbnail_owned_file_id: avatar.thumbnail_owned_file_id,
      base_map_owned_file_id: avatar.base_map_owned_file_id,
      emissive_map_owned_file_id: avatar.emissive_map_owned_file_id,
      normal_map_owned_file_id: avatar.normal_map_owned_file_id,
      orm_map_owned_file_id: avatar.orm_map_owned_file_id,

      updated_at: new Date()
    }
  },
  meta: { fetch: UPDATE, resource: "avatar_listings" }
});

export const AVATAR_REVIEWED = "AVATAR_REVIEWED";
export const avatarReviewed = id => ({
  type: AVATAR_REVIEWED,
  payload: {
    id,
    data: { reviewed_at: new Date() }
  },
  meta: {
    fetch: UPDATE,
    resource: "avatars",
    refresh: true
  }
});
