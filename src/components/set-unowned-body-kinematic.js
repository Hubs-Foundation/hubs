/* global NAF */
AFRAME.registerComponent("set-unowned-body-kinematic", {
  play() {
    if (!this.hasBeenHereBefore) {
      // Do this in play instead of init so that the ammo-body and networked components are done
      this.hasBeenHereBefore = true;

      if (!NAF.utils.isMine(this.el)) {
        this.el.setAttribute("ammo-body", { type: "kinematic" });
      }
    }
    this.setBodyKinematic = this.setBodyKinematic.bind(this);
    this.el.addEventListener("ownership-lost", this.setBodyKinematic);
  },
  pause() {
    this.el.removeEventListener("ownership-lost", this.setBodyKinematic);
  },
  setBodyKinematic() {
    if (!this.el.body) {
      console.error("There wasn't a body but we wish there was a body");
    } else {
      this.el.setAttribute("ammo-body", { type: "kinematic" });
    }
  }
});
