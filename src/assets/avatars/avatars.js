import { getReticulumFetchUrl } from "../../utils/phoenix-utils";

export const avatars = [
  {
    id: "botdefault",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotDefault_Avatar-9f71f8ff22.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botdefault-thumb-cac1cd33997f.png"
  },
  {
    id: "botbobo",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotBobo_Avatar-f9740a010b.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botbobo-thumb-7e5a7514d6e0.png"
  },
  {
    id: "botdom",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotDom_Avatar-0c48bf15a5.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botdom-thumb-672751a470fb.png"
  },
  {
    id: "botgreg",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotGreg_Avatar-98d39797bb.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botgreg-thumb-62793e4ebfbb.png"
  },
  {
    id: "botguest",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotGuest_Avatar-78cd857332.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botguest-thumb-ce784d94bfc3.png"
  },
  {
    id: "botjim",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotJim_Avatar-d28005a687.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botjim-thumb-2224a64f22c0.png"
  },
  {
    id: "botkev",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotKev_Avatar-a95787bb51.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botkev-thumb-cdff38b092e6.png"
  },
  {
    id: "botpinky",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotPinky_Avatar-b0b93f8675.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botpinky-thumb-53ae8078d67e.png"
  },
  {
    id: "botrobert",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotRobert_Avatar-e9554880f3.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botrobert-thumb-7cd9062f4915.png"
  },
  {
    id: "botwoody",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotWoody_Avatar-0140485a23.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botwoody-thumb-fa261ed702c7.png"
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

function fetchAvatarGltfUrl(avatarId) {
  return fetch(getReticulumFetchUrl(`/api/v1/avatars/${avatarId}`))
    .then(r => r.json())
    .then(({ avatars }) => avatars[0].gltf_url);
}

export async function getAvatarSrc(avatarId) {
  switch (getAvatarType(avatarId)) {
    case AVATAR_TYPES.LEGACY:
      return `#${avatarId}`;
    case AVATAR_TYPES.SKINNABLE:
      return fetchAvatarGltfUrl(avatarId);
    default:
      return avatarId;
  }
}

export async function getAvatarGltfUrl(avatarId) {
  switch (getAvatarType(avatarId)) {
    case AVATAR_TYPES.LEGACY:
      return avatars.find(avatar => avatar.id === avatarId).model;
    case AVATAR_TYPES.SKINNABLE:
      return fetchAvatarGltfUrl(avatarId);
    default:
      // Assume avatarId is already a URL.
      return avatarId;
  }
}
