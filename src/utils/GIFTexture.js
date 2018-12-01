import GIFWorker from "../workers/gifparsing.worker.js";

export default class GIFTexture extends THREE.Texture {
  constructor(frames, delays, disposals) {
    super(document.createElement("canvas"));
    this.image.width = frames[0].width;
    this.image.height = frames[0].height;

    this._ctx = this.image.getContext("2d");

    this.generateMipmaps = false;
    this.isVideoTexture = true;
    this.minFilter = THREE.NearestFilter;

    this.frames = frames;
    this.delays = delays;
    this.disposals = disposals;

    this.frame = 0;
    this.frameStartTime = Date.now();
  }

  update() {
    if (!this.frames || !this.delays || !this.disposals) return;
    const now = Date.now();
    if (now - this.frameStartTime > this.delays[this.frame]) {
      if (this.disposals[this.frame] === 2) {
        this._ctx.clearRect(0, 0, this.image.width, this.image.width);
      }
      this.frame = (this.frame + 1) % this.frames.length;
      this.frameStartTime = now;
      this._ctx.drawImage(this.frames[this.frame], 0, 0, this.image.width, this.image.height);
      this.needsUpdate = true;
    }
  }
}

export function loadGIFTexture(src) {
  return new Promise((resolve, reject) => {
    // TODO: pool workers
    const worker = new GIFWorker();
    worker.onmessage = e => {
      const [success, frames, delays, disposals] = e.data;
      if (!success) {
        reject(`error loading gif: ${e.data[1]}`);
        return;
      }

      let loadCnt = 0;
      for (let i = 0; i < frames.length; i++) {
        const img = new Image();
        img.onload = e => {
          loadCnt++;
          frames[i] = e.target;
          if (loadCnt === frames.length) {
            const texture = new GIFTexture(frames, delays, disposals);
            texture.image.src = src;
            texture.encoding = THREE.sRGBEncoding;
            texture.minFilter = THREE.LinearFilter;
            resolve(texture);
          }
        };
        img.src = frames[i];
      }
    };
    fetch(src, { mode: "cors" })
      .then(r => r.arrayBuffer())
      .then(rawImageData => {
        worker.postMessage(rawImageData, [rawImageData]);
      })
      .catch(reject);
  });
}
