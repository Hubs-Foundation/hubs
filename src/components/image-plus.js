import GIFWorker from "../workers/gifparsing.worker.js";

class GIFTexture extends THREE.Texture {
  constructor(frames, delays) {
    super(frames[0][0]);
    this.generateMipmaps = false;
    this.isVideoTexture = true;
    this.minFilter = THREE.NearestFilter;

    this.frames = frames;
    this.delays = delays;

    this.frame = 0;
    this.frameStartTime = Date.now();
  }

  update() {
    if (!this.frames || !this.delays) return;

    const now = Date.now();

    if (now - this.frameStartTime > this.delays[this.frame]) {
      this.frame = (this.frame + 1) % this.frames.length;
      this.frameStartTime = now;
      // console.log(this.gifData.frame, this.gifData.frames[this.gifData.frame][0]);
      this.image = this.frames[this.frame][0];
      this.needsUpdate = true;
    }
  }
}

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

  async update() {
    // textureLoader.load(
    //   getProxyUrl(this.data.src),
    //   texture => {
    //     this.el.setAttribute("material", {
    //       transparent: true,
    //       src: texture
    //     });
    //   },
    //   function() {
    //     /* no-op */
    //   },
    //   function(xhr) {
    //     console.error("`$s` could not be fetched (Error code: %s; Response: %s)", xhr.status, xhr.statusText);
    //   }
    // );

    const json = await fetch("https://smoke-dev.reticulum.io/api/v1/media", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        media: {
          url: this.data.src
        }
      })
    }).then(r => r.json());

    const rawImageData = await fetch(json.images.raw, { mode: "cors" }).then(r => r.arrayBuffer());
    const worker = new GIFWorker();
    worker.onmessage = e => {
      const [frames, delays, width, height] = e.data;
      const material = this.el.components.material.material;
      material.map = new GIFTexture(frames, delays);
      material.transparent = true;
      material.needsUpdate = true;
      this._fit(width, height);
    };
    worker.postMessage(rawImageData, [rawImageData]);
  }
});
