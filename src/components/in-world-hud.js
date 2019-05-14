AFRAME.registerComponent("in-world-hud", {
  init() {
    this.inviteBtn = this.el.querySelector(".invite-btn");
    this.onInviteClick = () => {
      this.el.emit("action_invite");
    };
  },

  play() {
    this.inviteBtn.object3D.addEventListener("interact", this.onInviteClick);
  },

  pause() {
    this.inviteBtn.object3D.removeEventListener("interact", this.onInviteClick);
  }
});
