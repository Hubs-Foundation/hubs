AFRAME.registerSystem("permissions", {
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
