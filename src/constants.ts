export enum COLLISION_LAYERS {
  ALL = -1,
  NONE = 0,
  INTERACTABLES = 1 << 0,
  ENVIRONMENT = 1 << 1,
  AVATAR = 1 << 2,
  HANDS = 1 << 3,
  MEDIA_FRAMES = 1 << 4,
  // @TODO we should split these "sets" off into something other than COLLISION_LAYERS or at least name
  // them differently to indicate they are a combination of multiple bits
  DEFAULT_INTERACTABLE = INTERACTABLES | ENVIRONMENT | AVATAR | HANDS | MEDIA_FRAMES,
  UNOWNED_INTERACTABLE = INTERACTABLES | HANDS | MEDIA_FRAMES,
  DEFAULT_SPAWNER = INTERACTABLES | HANDS
}

export enum AAModes {
  NONE = "NONE",
  SMAA = "SMAA",
  MSAA_2X = "MSAA_2X",
  MSAA_4X = "MSAA_4X",
  MSAA_8X = "MSAA_8X"
}

export const PRIVACY = "https://hubsfoundation.org/hubs-privacy-policy";
export const TERMS = "https://hubsfoundation.org/hubs-terms-of-use";
