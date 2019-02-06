AFRAME.registerComponent("ambient-light", {
  schema: {
    color: { type: "color" },
    intensity: { default: 1.0 }
  },

  init() {
    const el = this.el;
    this.light = new THREE.AmbientLight();
    this.el.setObject3D("ambient-light", this.light);
    this.el.sceneEl.systems.light.registerLight(el);
    this.rendererSystem = this.el.sceneEl.systems.renderer;
  },

  update(prevData) {
    if (this.data.color !== prevData.color) {
      const color = new THREE.Color(this.data.color);
      this.rendererSystem.applyColorCorrection(color);
      this.light.color.copy(color);
    }

    if (this.data.intensity !== prevData.intensity) {
      this.light.intensity = this.data.intensity;
    }
  },

  remove: function() {
    this.el.removeObject3D("ambient-light");
  }
});
