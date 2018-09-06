import { keyboard } from "./keyboard-frame";
import { mouse } from "./mouse-frame";
import { touch } from "./touch-frame";

const history = {
  ring: [],
  ringIdx: 0,
  ringLength: 20,
  save: function save(actions, sets) {
    const { ring, ringIdx, ringLength } = this;
    const record = { frame: {}, sets: [] }; // garbage
    for (const datum in actions) {
      record.frame[datum] = actions[datum];
    }
    for (const idx in sets) {
      record.sets.push(sets[idx]);
    }
    ring[ringIdx] = record; // garbage
    this.ringIdx = (ringIdx + 1) % ringLength;
    return record;
  },
  frame: function frame(idx) {
    const { ring, ringIdx, ringLength } = this;
    return ring[(ringLength + ringIdx - idx) % ringLength];
  }
};

const actions = {};

const sets = [
  "muteToggling",
  "screenShareToggling",
  "selfMoving",
  "selfSnapRotating",
  "notTransientLooking",
  "notLockedLooking",
  "cursorMoving",
  "debug"
  // transientLooking
  // lockedLooking
  // targetHovering
];

const pendingSetChanges = [];

const devices = [keyboard, mouse, touch];

const state = {
  history,
  actions,
  sets,
  pendingSetChanges,
  devices
};

AFRAME.registerSystem("actions", {
  poll(action) {
    return state.actions[action];
  },

  active(set) {
    return state.sets.includes(set);
  },

  activate(set) {
    state.pendingSetChanges.push({ set, change: "activate" });
  },

  deactivate(set) {
    state.pendingSetChanges.push({ set, change: "deactivate" });
  },

  frame(idx) {
    return state.history.frame(idx);
  },

  state() {
    return state;
  },

  tick() {
    state.pendingSetChanges.forEach(sc => {
      const active = this.active(sc.set);
      if (!active && sc.change === "activate") {
        state.sets.push(sc.set);
      } else if (active && sc.change === "deactivate") {
        state.sets.splice(state.sets.indexOf(sc.set), 1);
      }
    });
    state.pendingSetChanges.length = 0; // garbage
    state.priorities = {}; // garbage
    state.devices.forEach(device => {
      device.fillActionFrame(state.sets, state.priorities, state.actions);
    });
    state.devices.forEach(device => {
      device.resolvePriorityConflicts(state.sets, state.priorities, state.actions);
    });

    state.history.save(state.actions, state.sets);
  }
});

AFRAME.registerSystem("debug-actions", {
  tick() {
    const actions = AFRAME.scenes[0].systems.actions;
    if (actions.poll("logActiveSets")) {
      console.log(actions.state().sets);
    }
  }
});
