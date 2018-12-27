/**
 * Toggles the visibility of this entity based on networked ownership
 * @namespace ui
 * @component visible-to-owner
 */
AFRAME.registerComponent("visible-to-owner", {
  init() {
    this.onStateChange = e => {
      this.el.setAttribute("visible", e.detail.newOwner === NAF.clientId);
    };
    NAF.utils.getNetworkedEntity(this.el).then(el => {
      el.addEventListener("ownership-changed", this.onStateChange);
      this.el.setAttribute("visible", NAF.utils.isMine(el));
    });
  }
});
