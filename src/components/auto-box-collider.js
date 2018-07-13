import { calculateBoxShape } from "../utils/auto-box-collider";
AFRAME.registerComponent("auto-box-collider", {
  schema: {
    resize: { default: false },
    resizeLength: { default: 0.5 }
  },

  init() {}
});
