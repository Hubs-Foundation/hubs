AFRAME.registerComponent("directional-light", {
  schema: {
    color: { type: "color" },
    intensity: { default: 1.0 },
    castShadow: { default: true },
    shadowMapResolution: { default: [512, 512] },
    shadowBias: { default: 0 },
    shadowRadius: { default: 1 }
  },

  init() {
    this.light = new THREE.DirectionalLight();
    this.light.position.set(0, 0, 0);
    this.light.target.position.set(0, 0, 1);
    this.light.add(this.light.target);
    this.el.setObject3D("directional-light", this.light);
  },

  update(prevData) {
    const light = this.light;

    if (this.data.color !== prevData.color) {
      const color = new THREE.Color(this.data.color);
      color.convertSRGBToLinear();
      light.color.copy(color);
    }

    if (this.data.intensity !== prevData.intensity) {
      light.intensity = this.data.intensity;
    }

    if (this.data.castShadow !== prevData.castShadow) {
      light.castShadow = this.data.castShadow;
    }

    if (this.data.shadowBias !== prevData.shadowBias) {
      light.shadow.bias = this.data.shadowBias;
    }

    if (this.data.shadowRadius !== prevData.shadowRadius) {
      light.shadow.radius = this.data.shadowRadius;
    }

    const [width, height] = this.data.shadowMapResolution;
    const [prevWidth, prevHeight] = prevData.shadowMapResolution ? prevData.shadowMapResolution : [512, 512];

    if (width !== prevWidth || height !== prevHeight) {
      light.shadow.mapSize.set(width, height);

      if (light.shadow.map) {
        light.shadow.map.dispose();
        light.shadow.map = null;
      }
    }

    this.light.shadow.camera.matrixNeedsUpdate = true;
  },

  remove: function() {
    this.el.removeObject3D("directional-light");
  }
});
