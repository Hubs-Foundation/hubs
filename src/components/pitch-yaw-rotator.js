const degToRad = THREE.Math.degToRad;
AFRAME.registerComponent("pitch-yaw-rotator", {
  schema: {
    minPitch: { default: -50 },
    maxPitch: { default: 50 }
  },

  init() {
    this.pitch = 0;
    this.yaw = 0;
    this.look = this.look.bind(this);
  },

  look(deltaPitch, deltaYaw) {
    const { minPitch, maxPitch } = this.data;
    this.pitch += deltaPitch;
    this.pitch = Math.max(minPitch, Math.min(maxPitch, this.pitch));
    this.yaw += deltaYaw;
  },

  tick() {
    this.el.object3D.rotation.set(degToRad(this.pitch), degToRad(this.yaw), 0);
    this.el.object3D.rotation.order = "YXZ";

    const actions = AFRAME.scenes[0].systems.actions;
    const look = actions.poll("look");
    if (look) {
      this.look(look[0], look[1]);
    }
    if (actions.poll("startTransientLook")) {
      actions.deactivate("notTransientLooking");
      actions.activate("transientLooking");
    }
    if (actions.poll("stopTransientLook")) {
      actions.deactivate("transientLooking");
      actions.activate("notTransientLooking");
    }
    if (actions.poll("startLockedLook")) {
      actions.deactivate("notLockedLooking");
      actions.activate("lockedLooking");
    }
    if (actions.poll("stopLockedLook")) {
      actions.deactivate("lockedLooking");
      actions.activate("notLockedLooking");
    }
  }
});
