AFRAME.registerComponent("networked-avatar", {
  schema: {
    left_hand_pose: { default: 0 },
    right_hand_pose: { default: 0 }
  },
  init() {
    console.log("networked-avatar", this.el);
  }
});
