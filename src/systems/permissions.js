AFRAME.registerSystem("permissions", {
  can(permissionName) {
    return window.APP.hubChannel.permissions[permissionName];
  },
  fetchPermissions() {
    return window.APP.hubChannel.fetchPermissions();
  }
});
