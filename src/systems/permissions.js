AFRAME.registerSystem("permissions", {
  onPermissionsUpdated(handler) {
    if (window.APP.hubChannel) {
      window.APP.hubChannel.addEventListener("permissions_updated", handler);
    } else {
      window.addEventListener(
        "hub_channel_ready",
        () => window.APP.hubChannel.addEventListener("permissions_updated", handler),
        { once: true }
      );
    }
  },
  can(permissionName) {
    return !!window.APP.hubChannel.can(permissionName);
  },
  canOrWillIfCreator(permissionName) {
    return !!window.APP.hubChannel.canOrWillIfCreator(permissionName);
  },
  fetchPermissions() {
    return window.APP.hubChannel.fetchPermissions();
  }
});
