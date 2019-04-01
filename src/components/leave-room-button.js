AFRAME.registerComponent("leave-room-button", {
  init() {
    this.onClick = () => {
      console.log("click");
      this.el.sceneEl.emit("leave_room_requested");
    };
  },

  play() {
    this.el.addEventListener("grab-start", this.onClick);
  },

  pause() {
    this.el.removeEventListener("grab-start", this.onClick);
  }
});
