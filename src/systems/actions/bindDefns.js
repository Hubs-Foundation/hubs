//                    alice - is it true that comments that are born true, die a lie?
//                      bob - hard to say. can anything that doesn't execute be true?
//sets :
//  selfSnapRotating
//  muteToggling
//  screenShareToggling
//  selfMoving
//  notTransientLooking
//  transientLooking
//  looking
//  notLockedLooking
//  lockedLooking
//  cursorMoving
//  targetHovering
//  objectMoving
// sets + actions :
//  selfSnapRotating
//    snapRotateLeft
//
export const keyboardBindDefn = [
  {
    set: "selfSnapRotating",
    action: "snapRotateLeft",
    filter: "keydown",
    key: "q"
  },
  {
    set: "selfSnapRotating",
    action: "snapRotateRight",
    filter: "keydown",
    key: "e"
  },
  {
    set: "muteToggling",
    action: "toggleMute",
    filter: "keydown",
    key: "m"
  },
  {
    set: "screenShareToggling",
    action: "toggleScreenShare",
    filter: "keydown",
    key: "b"
  },
  {
    set: "selfMoving",
    action: "accSelf",
    filter: "key4_to_vec2",
    filter_params: {
      keys: ["d", "a", "w", "s"],
      filters: ["key", "key", "key", "key"]
    }
  },
  {
    set: "selfMoving",
    action: "boost",
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
    set: "looking",
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

export const touchscreenBindDefn = [
  {
    set: "selfMoving",
    action: "accSelf",
    filter: "vec2",
    key: "onScreenJoystickLeft"
  },
  {
    set: "cursorMoving",
    action: "cursorMovement",
    filter: "vec2",
    key: "cursorMoverVec2"
  },
  {
    set: "looking",
    action: "look",
    filter: "vec2",
    key: "cameraMoverVec2"
  }
];

[keyboardBindDefn, mouseBindDefn, touchscreenBindDefn].forEach(defn => {
  defn.forEach(binding => {
    if (binding.priorityKey) return;
    // Generate default priorityKey
    binding.priorityKey = binding.set + binding.action + binding.filter;
  });
});
