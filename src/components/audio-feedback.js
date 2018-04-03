AFRAME.registerComponent("networked-audio-analyser", {
  schema: {},
  async init() {
    const networkedEl = await NAF.utils.getNetworkedEntity(this.el);
    const ownerId = networkedEl.components.networked.data.owner;

    const stream = await NAF.connection.adapter.getMediaStream(ownerId);

    if (!stream) {
      return;
    }

    const ctx = THREE.AudioContext.getContext();
    const source = ctx.createMediaStreamSource(stream);
    this.analyser = ctx.createAnalyser();
    this.levels = new Uint8Array(this.analyser.frequencyBinCount);
    source.connect(this.analyser);
  },

  tick: function() {
    if (!this.analyser) return;

    this.analyser.getByteFrequencyData(this.levels);

    let sum = 0;
    for (let i = 0; i < this.levels.length; i++) {
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
    analyserSrc: { type: "selector" }
  },
  init: function() {
    this.onAudioFrequencyChange = this.onAudioFrequencyChange.bind(this);
  },

  play() {
    (this.data.analyserSrc || this.el).addEventListener("audioFrequencyChange", this.onAudioFrequencyChange);
  },

  pause() {
    (this.data.analyserSrc || this.el).removeEventListener("audioFrequencyChange", this.onAudioFrequencyChange);
  },

  onAudioFrequencyChange(e) {
    if (!this.mat) return;
    this.object3D.mesh.color.setScalar(1 + e.detail.volume / 255 * 2);
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
    (this.data.analyserSrc || this.el).addEventListener("audioFrequencyChange", this.onAudioFrequencyChange);
  },

  pause() {
    (this.data.analyserSrc || this.el).removeEventListener("audioFrequencyChange", this.onAudioFrequencyChange);
  },

  onAudioFrequencyChange(e) {
    if (!this.el.object3D.visible) return;
    const { minScale, maxScale } = this.data;
    this.el.object3D.scale.setScalar(minScale + (maxScale - minScale) * e.detail.volume / 255);
  }
});
