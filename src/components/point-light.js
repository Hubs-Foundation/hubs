AFRAME.registerComponent("point-light", {
  schema: {
    color: { type: "color" },
    intensity: { default: 1.0 },
    range: { default: 0 },
    decay: { default: 2 },
    castShadow: { default: true },
    shadowMapResolution: { default: [512, 512] },
    shadowBias: { default: 0 },
    shadowRadius: { default: 1 }
  },

  init() {
    this.light = new THREE.PointLight();
    this.light.shadow.camera.matrixAutoUpdate = true;
    this.el.setObject3D("point-light", this.light);
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

    if (this.data.range !== prevData.range) {
      light.distance = this.data.range;
    }

    if (this.data.decay !== prevData.decay) {
      light.decay = this.data.decay;
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
  },

  remove: function() {
    this.el.removeObject3D("point-light");
  }
});
