const waitForConnected = function() {
  return new Promise(resolve => {
    NAF.clientId
      ? resolve()
      : document.body.addEventListener("connected", resolve);
  });
};

AFRAME.registerComponent("networked-audio-analyser", {
  schema: {},
  init() {
    waitForConnected()
      .then(() => {
        const networkedEl = NAF.utils.getNetworkedEntity(this.el);
        if (!networkedEl) {
          return Promise.reject(
            "Audio Analyzer must be added on a node, or a child of a node, with the `networked` component."
          );
        }
        const ownerId = networkedEl.components.networked.data.owner;
        console.log("audio Analyser for " + ownerId);
        return NAF.connection.adapter.getMediaStream(ownerId);
      })
      .then(stream => {
        const ctx = THREE.AudioContext.getContext();
        const source = ctx.createMediaStreamSource(stream);
        this.analyser = ctx.createAnalyser();
        this.levels = new Uint8Array(this.analyser.frequencyBinCount);
        source.connect(this.analyser);
        console.log(source, this.analyser);
      });
  },

  tick: function() {
    if (!this.analyser) return;

    this.analyser.getByteFrequencyData(this.levels);

    var sum = 0;
    for (var i = 0; i < this.levels.length; i++) {
      sum += this.levels[i];
    }
    this.volume = sum / this.levels.length;
    this.el.emit("audioFrequencyChange", {
      volume: this.volume,
      levels: this.levels
    });
  }
});

AFRAME.registerComponent("matcolor-audio-feedback", {
  schema: {
    analyserSrc: { type: "selector" },
    objectName: { type: "string" }
  },
  init: function() {
    this.onAudioFrequencyChange = this.onAudioFrequencyChange.bind(this);

    this.el.addEventListener("model-loaded", () => {
      console.log(this.data.objectName);
      this.mat = this.el.object3D.getObjectByName(
        this.data.objectName
      ).material;
      console.log("mat", this.mat);
    });
  },

  play() {
    (this.data.analyserSrc || this.el).addEventListener(
      "audioFrequencyChange",
      this.onAudioFrequencyChange
    );
  },

  pause() {
    (this.data.analyserSrc || this.el).removeEventListener(
      "audioFrequencyChange",
      this.onAudioFrequencyChange
    );
  },

  onAudioFrequencyChange(e) {
    if (!this.mat) return;
    this.mat.color.setScalar(1 + e.detail.volume / 255 * 2);
  }
});

AFRAME.registerComponent("scale-audio-feedback", {
  schema: {
    analyserSrc: { type: "selector" },

    minScale: { default: 1 },
    maxScale: { default: 2 }
  },

  init() {
    this.onAudioFrequencyChange = this.onAudioFrequencyChange.bind(this);
  },

  play() {
    (this.data.analyserSrc || this.el).addEventListener(
      "audioFrequencyChange",
      this.onAudioFrequencyChange
    );
  },

  pause() {
    (this.data.analyserSrc || this.el).removeEventListener(
      "audioFrequencyChange",
      this.onAudioFrequencyChange
    );
  },

  onAudioFrequencyChange(e) {
    const { minScale, maxScale } = this.data;
    this.el.object3D.scale.setScalar(
      minScale + (maxScale - minScale) * e.detail.volume / 255
    );
  }
});
