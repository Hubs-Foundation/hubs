import { leftJoystick } from "./touch/left-joystick";

export const touch = {
  name: "touch",
  fillActionFrame: function fillActionFrame(sets, priorities, actions) {
    leftJoystick.fillActionFrame(sets, priorities, actions);
  },

  resolvePriorityConflicts: function resolvePriorityConflicts(sets, priorities, actions) {
    leftJoystick.resolvePriorityConflicts(sets, priorities, actions);
  }
};

