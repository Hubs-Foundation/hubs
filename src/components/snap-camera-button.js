AFRAME.registerComponent("snap-camera-button", {
  init() {
    this.el.addEventListener("grab-start", () => {
      console.log(this.el.parentNode.parentNode);
      this.el.parentNode.parentNode.components["camera-tool"].takeSnapshotNextTick = true;
    });
  }
});
