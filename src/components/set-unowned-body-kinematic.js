import { COLLISION_LAYERS } from "../constants";

AFRAME.registerComponent("set-unowned-body-kinematic", {
  init() {
    this.setBodyKinematic = this.setBodyKinematic.bind(this);
  },
  play() {
    this.el.addEventListener("ownership-lost", this.setBodyKinematic);

    if (!this.didThisOnce) {
      // Do this in play instead of init so that the ammo-body and networked components are done
      this.didThisOnce = true;

      if (!this.el.components.networked || !NAF.utils.isMine(this.el)) {
        this.setBodyKinematic();
      }
    }
  },
  pause() {
    this.el.removeEventListener("ownership-lost", this.setBodyKinematic);
  },
  setBodyKinematic() {
    this.el.setAttribute("body-helper", {
      type: "kinematic",
      collisionFilterMask: COLLISION_LAYERS.UNOWNED_INTERACTABLE
    });
  }
});
