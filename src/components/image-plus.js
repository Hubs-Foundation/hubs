AFRAME.registerComponent("image-plus", {
  dependencies: ["geometry", "material"],

  schema: {
    src: { type: "string" },

    initialOffset: { default: { x: 0, y: 0, z: -1.5 } },
    reorientOnGrab: { default: false }
  },

  _fit(w, h) {
    const ratio = (h || 1.0) / (w || 1.0);
    const geo = this.el.geometry;
    let width, height;
    if (geo && geo.width) {
      if (geo.height && ratio > 1) {
        width = geo.width / ratio;
      } else {
        height = geo.height * ratio;
      }
    } else if (geo && geo.height) {
      width = geo.width / ratio;
    } else {
      width = Math.min(1.0, 1.0 / ratio);
      height = Math.min(1.0, ratio);
    }
    this.el.setAttribute("geometry", { width, height });
    this.el.setAttribute("shape", {
      halfExtents: {
        x: width / 2,
        y: height / 2,
        z: 0.05
      }
    });
  },

  _onMaterialLoaded(e) {
    const src = e.detail.src;
    const w = src.videoWidth || src.width;
    const h = src.videoHeight || src.height;
    if (w || h) {
      this._fit(w, h);
    }
  },

  _onGrab: (function() {
    const q = new THREE.Quaternion();
    return function() {
      if (this.data.reorientOnGrab) {
        this.billboardTarget.getWorldQuaternion(q);
        this.el.body.quaternion.copy(q);
      }
    };
  })(),

  init() {
    this._onMaterialLoaded = this._onMaterialLoaded.bind(this);
    this._onGrab = this._onGrab.bind(this);

    this.el.addEventListener("materialtextureloaded", this._onMaterialLoaded);
    this.el.addEventListener("materialvideoloadeddata", this._onMaterialLoaded);
    this.el.addEventListener("grab-start", this._onGrab);

    const worldPos = new THREE.Vector3().copy(this.data.initialOffset);
    this.billboardTarget = document.querySelector("#player-camera").object3D;
    this.billboardTarget.localToWorld(worldPos);
    this.el.object3D.position.copy(worldPos);
    this.billboardTarget.getWorldQuaternion(this.el.object3D.quaternion);
  },

  update() {
    this.el.setAttribute("material", "src", this.data.src);
  }
});
