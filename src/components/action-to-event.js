AFRAME.registerComponent("action-to-event", {
  multiple: true,

  schema: {
    path: { type: "string" },
    event: { type: "string" },
    withPermission: { type: "string" }
  },

  init() {
    this.needsPermission = !!this.data.withPermission;
    this.updatePermissions = () => {
      if (!this.needsPermission || !window.APP.hubChannel) return;
      this.hasPermission = window.APP.hubChannel.canOrWillIfCreator(this.data.withPermission);
    };
  },

  play() {
    this.el.sceneEl.systems.permissions.onPermissionsUpdated(this.updatePermissions);
    this.updatePermissions();
  },

  pause() {
    window.APP.hubChannel.removeEventListener("permissions_updated", this.updatePermissions);
  },

  tick() {
    if (this.needsPermission && !this.hasPermission) return;
    const userinput = AFRAME.scenes[0].systems.userinput;
    if (userinput.get(this.data.path)) {
      this.el.emit(this.data.event);
    }
  }
});
