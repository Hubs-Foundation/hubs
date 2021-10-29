/**
 * HUD panel for muting, freezing, and other controls that don't necessarily have hardware buttons.
 * @namespace ui
 * @component in-world-hud
 */
 AFRAME.registerComponent("in-world-hud", {
  init() {
    this.mic = this.el.querySelector(".mic");
    this.testmenu = this.el.querySelector(".test-menu");
    this.background = this.el.querySelector(".bg");

    this.updateButtonStates = () => {
      this.mic.setAttribute("mic-button", "active", this.el.sceneEl.is("muted"));
    };

    this.onStateChange = evt => {
      if (!(evt.detail === "muted" || evt.detail === "frozen"))
        return;
      this.updateButtonStates();
    };

    this.onMicClick = () => {
      this.el.emit("action_mute");
    };

    this.onTestMenu = () => {
      // this.el.emit("action_invite");
      console.log("menu button pressed");
    };

    this.onHubUpdated = e => {
      // this.inviteBtn.object3D.visible = e.detail.hub.entry_mode !== "invite";
    };
  },

  play() {
    this.el.sceneEl.addEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.addEventListener("stateremoved", this.onStateChange);
    this.el.sceneEl.systems.permissions.onPermissionsUpdated(this.updateButtonStates);
    this.el.sceneEl.addEventListener("hub_updated", this.onHubUpdated);
    this.updateButtonStates();

    this.mic.object3D.addEventListener("interact", this.onMicClick);
    this.testmenu.object3D.addEventListener("interact", this.onTestMenu);
  },

  pause() {
    this.el.sceneEl.removeEventListener("stateadded", this.onStateChange);
    this.el.sceneEl.removeEventListener("stateremoved", this.onStateChange);
    window.APP.hubChannel.removeEventListener("permissions_updated", this.updateButtonStates);
    this.el.sceneEl.removeEventListener("hub_updated", this.onHubUpdated);

    this.mic.object3D.removeEventListener("interact", this.onMicClick);
    this.testmenu.object3D.removeEventListener("interact", this.onTestMenu);
  }
});
