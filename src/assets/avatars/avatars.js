import { getReticulumFetchUrl } from "../../utils/phoenix-utils";

export const avatars = [
  {
    id: "botdefault",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotDefault_Avatar-9f71f8ff22.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/707c79482a.jpg"
  },
  {
    id: "botbobo",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotBobo_Avatar-f9740a010b.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/707c79482a.jpg"
  },
  {
    id: "botdom",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotDom_Avatar-0c48bf15a5.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/707c79482a.jpg"
  },
  {
    id: "botgreg",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotGreg_Avatar-98d39797bb.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/707c79482a.jpg"
  },
  {
    id: "botguest",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotGuest_Avatar-78cd857332.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/707c79482a.jpg"
  },
  {
    id: "botjim",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotJim_Avatar-d28005a687.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/707c79482a.jpg"
  },
  {
    id: "botkev",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotKev_Avatar-a95787bb51.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/707c79482a.jpg"
  },
  {
    id: "botpinky",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotPinky_Avatar-b0b93f8675.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/707c79482a.jpg"
  },
  {
    id: "botrobert",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotRobert_Avatar-e9554880f3.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/707c79482a.jpg"
  },
  {
    id: "botwoody",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotWoody_Avatar-0140485a23.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/707c79482a.jpg"
  }
];

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

export async function getAvatarSrc(avatarId) {
  switch (getAvatarType(avatarId)) {
    case AVATAR_TYPES.LEGACY:
      return `#${avatarId}`;
    case AVATAR_TYPES.SKINNABLE:
      return fetch(getReticulumFetchUrl(`/api/v1/avatars/${avatarId}`))
        .then(r => r.json())
        .then(({ avatars }) => avatars[0].gltf_url);
  }
  return avatarId;
}
