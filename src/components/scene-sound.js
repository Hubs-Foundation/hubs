// As temporary measure to avoid having to customize the `sound` component that currently lives in `aframe`,
// we say that a `scene-sound` will have an associated `sound` component that is triggered when the given
// event is fired on the scene.
AFRAME.registerComponent("scene-sound", {
  multiple: true,
  schema: {
    sound: { type: "string" },
    on: { type: "string" },
    off: { type: "string" }
  },

  init() {
    const sound = this.el.components[`${this.attrName.replace("scene-", "")}`];
    this.el.sceneEl.addEventListener(this.data.on, sound.playSound);
    sound.stopSound = sound.stopSound.bind(sound); // wat

    if (this.data.off) {
      this.el.sceneEl.addEventListener(this.data.off, sound.stopSound);
    }
  }
});
