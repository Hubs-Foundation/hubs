import { ringbuffer, applySetChanges } from "./actions/utils";
import { keyboard, mouse } from "./actions/devices";
const devices = [keyboard, mouse];
const history = new ringbuffer();
const pendingSetChanges = [];

AFRAME.registerSystem("actions", {
  poll(action) {
    return history.read(0).actions[action];
  },

  isActive(set) {
    if (!this.didInit) return undefined;
    return history.read(0).sets.includes(set);
  },

  activate(set) {
    pendingSetChanges.push({ set, fn: "activate" });
  },

  deactivate(set) {
    pendingSetChanges.push({ set, fn: "deactivate" });
  },

  init() {
    this.didInit = true; // One day I'll work on a game where we decide the control flow,
    // but today is not that day. Components and systems initialize (and run) in an order
    // decided at runtime by the gods of wind and sand, so that poll may be called before
    // this init function runs.
    const frame = {
      sets: [
        "muteToggling",
        "screenShareToggling",
        "selfMoving",
        "selfSnapRotating",
        "notTransientLooking",
        "notLockedLooking",
        "cursorMoving",
        "debug"
      ],
      actions: {},
      priorities: {}
    };
    history.write(frame);
  },

  tick() {
    const prev = history.read(0);
    const frame = {
      sets: [],
      actions: {},
      priorities: {}
    };
    const {sets, actions, priorities} = frame;
    for (const idx in prev.sets) {
      sets.push(prev.sets[idx]);
    }
    pendingSetChanges.forEach(sc => {
      const {set, fn} = sc;
      const isActive = sets.includes(set);
      if (!isActive && fn === "activate") {
        sets.push(set);
      } else if (isActive && fn === "deactivate") {
        sets.splice(sets.indexOf(set), 1); // TODO: replace splice
      }
    });
    applySetChanges(pendingSetChanges, frame.sets);
    pendingSetChanges.length = 0; // garbage
    devices.forEach(device => {
      device.fillActionFrame(frame);
    });
    history.write(frame);
  }
});
