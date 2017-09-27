AFRAME.registerComponent("rig-selector", {
  schema: {
    vive: { default: "" },
    oculus: { default: "" },
    daydream: { default: "" },
    gearvr: { default: "" },
    mobile: { default: "" },
    desktop: { default: "" }
  },
  init: function() {
    var vrDevice = this.el.sceneEl.effect.getVRDisplay();
    var rigEl = document.createElement("a-entity");

    if (vrDevice !== undefined) {
      var displayName = vrDevice.displayName;

      if (displayName.indexOf("Oculus") !== -1) {
        rigEl.setAttribute(
          "template",
          "src:" + this.data.oculus || this.data.desktop
        );
      } else if (displayName.indexOf("OpenVR") !== -1) {
        rigEl.setAttribute(
          "template",
          "src:" + this.data.vive || this.data.desktop
        );
      } else if (displayName.indexOf("Daydream") !== -1) {
        rigEl.setAttribute(
          "template",
          "src:" + this.data.daydream || this.data.mobile
        );
      } else {
        rigEl.setAttribute(
          "template",
          "src:" + this.data.desktop || this.data.mobile
        );
      }
    } else {
      if (AFRAME.utils.device.isGearVR()) {
        rigEl.setAttribute(
          "template",
          "src:" + this.data.gearvr || this.data.mobile
        );
      } else if (AFRAME.utils.device.isMobile()) {
        rigEl.setAttribute(
          "template",
          "src:" + this.data.mobile || this.data.desktop
        );
      } else {
        rigEl.setAttribute(
          "template",
          "src:" + this.data.desktop || this.data.mobile
        );
      }
    }

    this.el.appendChild(rigEl);
  }
});
