module.exports = {
  COLLISION_LAYERS: {
    ALL: -1,
    NONE: 0,
    INTERACTABLES: 1,
    ENVIRONMENT: 2,
    AVATAR: 4,
    HANDS: 8,
    DEFAULT_INTERACTABLE: 1 | 2 | 4 | 8,
    UNOWNED_INTERACTABLE: 1 | 8,
    DEFAULT_SPAWNER: 1 | 8
  }
};
