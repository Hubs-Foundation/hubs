/* global NAF */
const COLLISION_LAYERS = require("../constants").COLLISION_LAYERS;

AFRAME.registerComponent("set-unowned-body-kinematic", {
  play() {
    this.setBodyKinematic = this.setBodyKinematic.bind(this);
    this.el.addEventListener("ownership-lost", this.setBodyKinematic);

    if (!this.hasBeenHereBefore) {
      // Do this in play instead of init so that the ammo-body and networked components are done
      this.hasBeenHereBefore = true;

      if (!NAF.utils.isMine(this.el)) {
        this.setBodyKinematic();
      }
    }
  },
  pause() {
    this.el.removeEventListener("ownership-lost", this.setBodyKinematic);
  },
  setBodyKinematic() {
    this.el.setAttribute("ammo-body", {
      type: "kinematic",
      collisionFilterMask: COLLISION_LAYERS.UNOWNED_INTERACTABLE
    });
    if (this.el.components["sticky-object"]) {
      this.el.components["sticky-object"].locked = true;
    }
  }
});
