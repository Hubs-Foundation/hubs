AFRAME.registerComponent("scene-sound", {
  multiple: true,
  schema: {
    sound: { type: "string" },
    on: { type: "string" }
  },

  init() {
    const sound = this.el.components[`${this.attrName.replace("scene-", "")}`];
    this.el.sceneEl.addEventListener(this.data.on, sound.playSound);
  }
});
