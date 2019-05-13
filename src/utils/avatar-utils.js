import { getReticulumFetchUrl } from "./phoenix-utils";
import { proxiedUrlFor } from "./media-utils";
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

console.log("loading avatars.js");
export async function getAvatarSrc(avatarId) {
  console.log("getAvatarSrc");
  switch (getAvatarType(avatarId)) {
    case AVATAR_TYPES.LEGACY:
      return `#${avatarId}`;
    case AVATAR_TYPES.SKINNABLE:
      return fetch(getReticulumFetchUrl(`/api/v1/avatars/${avatarId}`))
        .then(r => r.json())
        .then(({ avatars }) => avatars[0].gltf_url);
    case AVATAR_TYPES.URL:
      return proxiedUrlFor(avatarId);
  }

  return avatarId;
}
