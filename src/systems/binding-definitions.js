export const keyboardBindDefn = [
  {
    action: "logActiveSets",
    set: "debug",
    filter: "keydown",
    key: "l"
  },
  {
    action: "snapRotateLeft",
    set: "selfSnapRotating",
    filter: "keydown",
    key: "q"
  },
  {
    action: "snapRotateRight",
    set: "selfSnapRotating",
    filter: "keydown",
    key: "e"
  },
  {
    action: "toggleMute",
    set: "muteToggling",
    filter: "keydown",
    key: "m"
  },
  {
    action: "toggleScreenShare",
    set: "screenShareToggling",
    filter: "keydown",
    key: "b"
  },
  {
    action: "accSelf",
    set: "selfMoving",
    filter: "key4_to_vec2",
    filter_params: {
      keys: ["d", "a", "w", "s"],
      filters: ["key", "key", "key", "key"]
    }
  },
  {
    action: "boost",
    set: "selfMoving",
    filter: "key",
    key: "shift"
  }
];

export const mouseBindDefn = [
  {
    set: "notTransientLooking",
    action: "startTransientLook",
    filter: "keydown",
    key: "left",
    priorityKey: "lmb"
  },
  {
    set: "transientLooking",
    action: "stopTransientLook",
    filter: "keyup",
    key: "left"
  },
  {
    set: "transientLooking",
    action: "look",
    filter: "vec2_deltas",
    filterParams: {
      horizontalLookSpeed: 0.1,
      verticalLookSpeed: 0.06,
      keys: ["dY", "dX"],
      filters: ["number", "number"]
    },
    priorityKey: "mousemove"
  },
  {
    set: "notLockedLooking",
    action: "startLockedLook",
    filter: "keydown",
    key: "right"
  },
  {
    set: "lockedLooking",
    action: "stopLockedLook",
    filter: "keydown",
    key: "right"
  },
  {
    set: "lockedLooking",
    action: "look",
    filter: "vec2_deltas",
    filterParams: {
      horizontalLookSpeed: 0.1,
      verticalLookSpeed: 0.06,
      keys: ["dY", "dX"],
      filters: ["number", "number"]
    },
    priorityKey: "mousemove"
  },
  {
    set: "cursorMoving",
    action: "cursorMovement",
    filter: "vec2",
    key: "normalizedCoords",
    priorityKey: "mousemove"
  },
  {
    set: "targetHovering",
    action: "grabTargettedObject",
    filter: "keydown",
    key: "left",
    priorityKey: "lmb"
  },
  {
    set: "objectMoving",
    action: "dropGrabbedObject",
    filter: "keyup",
    key: "left"
  },
  {
    set: "objectMoving",
    action: "dCursorDistanceMod",
    filter: "number",
    key: "wheel"
  }
];

export const touchLeftJoystickBindDefn = [
  {
    set: "selfMoving",
    action: "accSelf",
    filter: "vec2",
    key: "joystickLeft"
  }
];

export const touchBindDefn = [
  {
    set: "cursorMoving",
    action: "cursorMovement",
    filter: "vec2",
    key: "cursorMoverVec2"
  },
  {
    set: "notTransientLooking", //TODO: looking should be its own set
    action: "look",
    filter: "vec2",
    key: "cameraMoverVec2"
  }
];
