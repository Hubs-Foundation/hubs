import { paths } from "../systems/actions/paths";

AFRAME.registerComponent("pinch-to-move", {
  schema: {
    speed: { default: 0.25 }
  },
  init() {
    this.axis = [0, 0];
  },
  tick() {
    const actions = AFRAME.scenes[0].systems.actions;
    const pinch = actions.poll(paths.device.touchscreen.pinchDelta);
    if (pinch) {
      this.axis[1] = pinch * this.data.speed;
      this.el.emit("move", { axis: this.axis });
    }
  }
});
