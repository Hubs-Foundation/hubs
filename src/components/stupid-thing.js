import { paths } from "../systems/actions/paths";

AFRAME.registerComponent("stupid-thing", {
  schema: {
    hand: { type: "string" }
  },

  tick() {
    const actions = AFRAME.scenes[0].systems.actions;
    if (actions.poll(paths.app[`${this.data.hand}HandGrab`])) {
      this.el.emit("primary_hand_grab");
    }
    if (actions.poll(paths.app[`${this.data.hand}HandDrop`])) {
      this.el.emit("primary_hand_release");
    }
  }
});
