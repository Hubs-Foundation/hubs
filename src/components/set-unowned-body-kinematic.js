/* global NAF */
AFRAME.registerComponent("set-unowned-body-kinematic", {
  play() {
    this.setBodyKinematic = this.setBodyKinematic.bind(this);
    this.el.addEventListener("ownership-lost", this.setBodyKinematic);

    if (!this.hasBeenHereBefore) {
      // Do this in play instead of init so that the ammo-body and networked components are done
      this.hasBeenHereBefore = true;

      if (!NAF.utils.isMine(this.el)) {
        this.el.setAttribute("ammo-body", { type: "kinematic" });
      }
    }
  },
  pause() {
    this.el.removeEventListener("ownership-lost", this.setBodyKinematic);
  },
  setBodyKinematic() {
    this.el.setAttribute("ammo-body", { type: "kinematic" });
  }
});
