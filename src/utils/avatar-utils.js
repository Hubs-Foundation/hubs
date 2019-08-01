import { fetchReticulumAuthenticated } from "./phoenix-utils";
import { proxiedUrlFor } from "./media-url-utils";
import { avatars } from "../assets/avatars/avatars";

export const AVATAR_TYPES = {
  LEGACY: "legacy",
  SKINNABLE: "skinnable",
  URL: "url"
};

const legacyAvatarIds = avatars.map(a => a.id);
export function getAvatarType(avatarId) {
  if (!avatarId || legacyAvatarIds.indexOf(avatarId) !== -1) return AVATAR_TYPES.LEGACY;
  if (avatarId.startsWith("http")) return AVATAR_TYPES.URL;
  return AVATAR_TYPES.SKINNABLE;
}

async function fetchSkinnableAvatar(avatarId) {
  const resp = await fetchReticulumAuthenticated(`/api/v1/avatars/${avatarId}`);
  return resp && resp.avatars && resp.avatars[0];
}

export async function fetchAvatar(avatarId) {
  switch (getAvatarType(avatarId)) {
    case AVATAR_TYPES.LEGACY:
      return {
        avatar_id: avatarId,
        gltf_url: avatars.find(avatar => avatar.id === avatarId).model
      };
    case AVATAR_TYPES.SKINNABLE:
      return fetchSkinnableAvatar(avatarId);
    case AVATAR_TYPES.URL:
      return {
        avatar_id: avatarId,
        gltf_url: proxiedUrlFor(avatarId)
      };
  }
}

async function fetchAvatarGltfUrl(avatarId) {
  return fetchAvatar(avatarId).then(avatar => avatar && avatar.gltf_url);
}

export function getAvatarSrc(avatarId) {
  switch (getAvatarType(avatarId)) {
    case AVATAR_TYPES.LEGACY:
      return `#${avatarId}`;
    case AVATAR_TYPES.SKINNABLE:
      return fetchAvatarGltfUrl(avatarId);
    case AVATAR_TYPES.URL:
      return proxiedUrlFor(avatarId);
    default:
      return avatarId;
  }
}

export async function getAvatarThumbnailUrl(avatarId) {
  switch (getAvatarType(avatarId)) {
    case AVATAR_TYPES.LEGACY:
      return avatars.find(avatar => avatar.id === avatarId).thumbnail;
    case AVATAR_TYPES.SKINNABLE:
      return fetchAvatar(avatarId).then(avatar => avatar.files.thumbnail);
    default:
      return "https://asset-bundles-prod.reticulum.io/bots/avatar_unavailable.png";
  }
}
