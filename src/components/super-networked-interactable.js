/* global NAF */
AFRAME.registerComponent("super-networked-interactable", {
  play: function() {
    // Do this in play instead of init so that we don't create an ammo-body
    // on accident if super-networked-interactable comes before ammo-body
    // in the html
    if (!this.hasBeenHereBefore) {
      this.hasBeenHereBefore = true;

      if (!NAF.utils.isMine(this.el)) {
        this.el.setAttribute("ammo-body", { type: "kinematic" });
      }
    }
  }
});
