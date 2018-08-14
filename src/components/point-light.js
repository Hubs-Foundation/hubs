AFRAME.registerComponent("point-light", {
  schema: {
    color: { type: "color" },
    intensity: { default: 1.0 },
    range: { default: 0 },
    castShadow: { default: true }
  },

  init() {
    const el = this.el;
    this.light = new THREE.PointLight();
    this.light.decay = 2;
    this.el.setObject3D("point-light", this.light);
    this.el.sceneEl.systems.light.registerLight(el);
  },

  update(prevData) {
    if (this.data.color !== prevData.color) {
      this.light.color.set(this.data.color);
    }

    if (this.data.intensity !== prevData.intensity) {
      this.light.intensity = this.data.intensity;
    }

    if (this.data.range !== prevData.range) {
      this.light.distance = this.data.range;
    }

    if (this.data.castShadow !== prevData.castShadow) {
      this.light.castShadow = this.data.castShadow;
    }
  },

  remove: function() {
    this.el.removeObject3D("point-light");
  }
});
