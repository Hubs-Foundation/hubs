let shouldLock = false;
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

  tick(t) {
    this.el.object3D.rotation.set(degToRad(this.pitch), degToRad(this.yaw), 0);
    this.el.object3D.rotation.order = "YXZ";

    const mouseFrame = AFRAME.scenes[0].systems.mouseFrame;
    if (mouseFrame.isActive("transientLooking") || mouseFrame.isActive("lockedLooking")) {
      const look = mouseFrame.poll("look");
      this.look(look[0], look[1]);
    }
    if (mouseFrame.isActive("notTransientLooking")) {
      if (mouseFrame.poll("startTransientLook")) {
        mouseFrame.deactivateSet("notTransientLooking");
        mouseFrame.activateSet("transientLooking");
      }
    }
    if (mouseFrame.isActive("transientLooking")) {
      if (mouseFrame.poll("stopTransientLook")) {
        mouseFrame.deactivateSet("transientLooking");
        mouseFrame.activateSet("notTransientLooking");
      }
    }
    if (mouseFrame.isActive("notLockedLooking")) {
      if (mouseFrame.poll("startLockedLook")) {
        mouseFrame.deactivateSet("notLockedLooking");
        mouseFrame.activateSet("lockedLooking");
        shouldLock = true;
      }
    }
    if (mouseFrame.isActive("lockedLooking")) {
      if (mouseFrame.poll("stopLockedLook")) {
        mouseFrame.deactivateSet("lockedLooking");
        mouseFrame.activateSet("notLockedLooking");
        shouldLock = false;
      }
    }

    // requestPointerLock can only be called on user gesture.
    document.querySelector("mousedown", () => {
      if (shouldLock) {
        document.body.requestPointerLock();
      } else {
        document.exitPointerLock();
      }
    });
  }
});
