import { getReticulumFetchUrl } from "../../utils/phoenix-utils";

export const avatars = [
  {
    id: "botdefault",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotDefault_Avatar-9f71f8ff22.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botdefault-thumb-42C4C7D3C01D085EAFDAC8BACE591CE6.png"
  },
  {
    id: "botbobo",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotBobo_Avatar-f9740a010b.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botbobo-thumb-261278FD5831E9CD89610D15948F23E4.png"
  },
  {
    id: "botdom",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotDom_Avatar-0c48bf15a5.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botdom-thumb-1160EB5E81D24F12CE643C520CE1E99E.png"
  },
  {
    id: "botgreg",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotGreg_Avatar-98d39797bb.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botgreg-thumb-F2A37F14F9C342EE44DDE9B24DD9B9FC.png"
  },
  {
    id: "botguest",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotGuest_Avatar-78cd857332.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botguest-thumb-F7A471250E2C10C2709325C3B02A8BBB.png"
  },
  {
    id: "botjim",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotJim_Avatar-d28005a687.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botjim-thumb-A2D195C1A51A082BCED58BD172481B39.png"
  },
  {
    id: "botkev",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotKev_Avatar-a95787bb51.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botkev-thumb-90746A7349E3F964C913EA612EE9A53F.png"
  },
  {
    id: "botpinky",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotPinky_Avatar-b0b93f8675.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botpinky-thumb-C2E69D4479077766B988DC3EE4F30BE5.png"
  },
  {
    id: "botrobert",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotRobert_Avatar-e9554880f3.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botrobert-thumb-9C33F2C752326E2CF4321EAA7BDB4E47.png"
  },
  {
    id: "botwoody",
    model: "https://asset-bundles-prod.reticulum.io/bots/BotWoody_Avatar-0140485a23.gltf",
    thumbnail: "https://asset-bundles-prod.reticulum.io/bots/botwoody-thumb-F1F1FA7E21301B5AC1D8872B4ED0CC56.png"
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

async function fetchAvatarGltfUrl(avatarId) {
  const resp = await fetch(getReticulumFetchUrl(`/api/v1/avatars/${avatarId}`));
  if (resp.status === 404) {
    return null;
  } else {
    return resp.json().then(({ avatars }) => avatars[0].gltf_url);
  }
}

export function getAvatarSrc(avatarId) {
  switch (getAvatarType(avatarId)) {
    case AVATAR_TYPES.LEGACY:
      return `#${avatarId}`;
    case AVATAR_TYPES.SKINNABLE:
      return fetchAvatarGltfUrl(avatarId);
    default:
      return avatarId;
  }
}

export function getAvatarGltfUrl(avatarId) {
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
