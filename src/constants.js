let bit = 0;
const nextBit = () => 1 << bit++;
const CL = {
  ALL: -1,
  NONE: 0,
  INTERACTABLES: nextBit(),
  ENVIRONMENT: nextBit(),
  AVATAR: nextBit(),
  HANDS: nextBit(),
  MEDIA_FRAMES: nextBit()
};

// @TODO we should split these "sets" off into something other than COLLISION_LAYERS or at least name
// them differently to indicate they are a combination of multiple bits
CL.DEFAULT_INTERACTABLE = CL.INTERACTABLES | CL.ENVIRONMENT | CL.AVATAR | CL.HANDS | CL.MEDIA_FRAMES;
CL.UNOWNED_INTERACTABLE = CL.INTERACTABLES | CL.HANDS;
CL.DEFAULT_SPAWNER = CL.INTERACTABLES | CL.HANDS;

module.exports = {
  COLLISION_LAYERS: CL
};
