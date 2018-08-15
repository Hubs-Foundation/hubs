AFRAME.registerComponent("hemisphere-light", {
  schema: {
    skyColor: { type: "color" },
    groundColor: { type: "color" },
    intensity: { default: 1.0 }
  },

  init() {
    const el = this.el;
    this.light = new THREE.HemisphereLight();
    this.light.position.set(0, 0, 0);
    this.el.setObject3D("hemisphere-light", this.light);
    this.el.sceneEl.systems.light.registerLight(el);
  },

  update(prevData) {
    if (this.data.skyColor !== prevData.skyColor) {
      this.light.color.set(this.data.skyColor);
    }

    if (this.data.groundColor !== prevData.groundColor) {
      this.light.groundColor.set(this.data.groundColor);
    }

    if (this.data.intensity !== prevData.intensity) {
      this.light.intensity = this.data.intensity;
    }
  },

  remove: function() {
    this.el.removeObject3D("hemisphere-light");
  }
});
