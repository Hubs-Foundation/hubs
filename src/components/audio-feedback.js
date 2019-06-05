// This computation is expensive, so we run on at most one avatar per frame, including quiet avatars.
// However if we detect an avatar is seen speaking (its volume is above DISABLE_AT_VOLUME_THRESHOLD)
// then we continue analysis for at least DISABLE_GRACE_PERIOD_MS and disable doing it every frame if
// the avatar is quiet during that entire duration (eg they are muted)
const DISABLE_AT_VOLUME_THRESHOLD = 0.00001;
const DISABLE_GRACE_PERIOD_MS = 10000;

/**
 * Emits audioFrequencyChange events based on a networked audio source
 * @namespace avatar
 * @component networked-audio-analyser
 */
AFRAME.registerComponent("networked-audio-analyser", {
  async init() {
    this.volume = 0;
    this.prevVolume = 0;
    this.smoothing = 0.3;
    this.threshold = 0.01;
    this._updateAnalysis = this._updateAnalysis.bind(this);
    this._runScheduledWork = this._runScheduledWork.bind(this);
    this.el.sceneEl.systems["frame-scheduler"].schedule(this._updateAnalysis, "audio-analyser");
    this.el.addEventListener("sound-source-set", event => {
      const ctx = THREE.AudioContext.getContext();
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 32;
      this.levels = new Uint8Array(this.analyser.frequencyBinCount);
      event.detail.soundSource.connect(this.analyser);
    });
  },

  remove: function() {
    this.el.sceneEl.systems["frame-scheduler"].unschedule(this._runScheduledWork, "audio-analyser");
  },

  tick: function(t) {
    if (!this.avatarIsQuiet) {
      this._updateAnalysis(t);
    }
  },

  _runScheduledWork: function() {
    if (this.avatarIsQuiet) {
      this._updateAnalysis();
    }
  },

  // Updates the analysis/volume. If t is passed, that implies this is called via tick
  // and so as a performance optimization will check to see if it's been at least DISABLE_GRACE_PERIOD_MS
  // since the last volume was seen above DISABLE_AT_VOLUME_THRESHOLD, and if so, will disable
  // tick updates until the volume exceeds the level again.
  _updateAnalysis: function(t) {
    if (!this.analyser) return;

    // take care with compatibility, e.g. safari doesn't support getFloatTimeDomainData
    this.analyser.getByteTimeDomainData(this.levels);

    let sum = 0;
    for (let i = 0; i < this.levels.length; i++) {
      const amplitude = (this.levels[i] - 128) / 128;
      sum += amplitude * amplitude;
    }
    let currVolume = Math.sqrt(sum / this.levels.length);
    if (currVolume < this.threshold) {
      currVolume = 0;
    }
    this.volume = this.smoothing * currVolume + (1 - this.smoothing) * this.prevVolume;
    this.prevVolume = this.volume;

    if (this.volume < DISABLE_AT_VOLUME_THRESHOLD) {
      if (t && this.lastSeenVolume && this.lastSeenVolume < t - DISABLE_GRACE_PERIOD_MS) {
        this.avatarIsQuiet = true;
      }
    } else {
      if (t) {
        this.lastSeenVolume = t;
      }

      this.avatarIsQuiet = false;
    }
  }
});

/**
 * Sets an entity's scale base on audioFrequencyChange events.
 * @namespace avatar
 * @component scale-audio-feedback
 */
AFRAME.registerComponent("scale-audio-feedback", {
  schema: {
    minScale: { default: 1 },
    maxScale: { default: 2 }
  },

  init() {
    this._playerCamera = document.getElementById("player-camera").object3D;
    this._playerCameraWorldPosition = new THREE.Vector3();
    this._worldPosition = new THREE.Vector3();
  },

  tick() {
    // TODO: come up with a cleaner way to handle this.
    // bone's are "hidden" by scaling them with bone-visibility, without this we would overwrite that.
    if (!this.el.object3D.visible) return;

    const { minScale, maxScale } = this.data;

    const audioAnalyser = this.el.components["networked-audio-analyser"];

    if (!audioAnalyser) return;

    const { object3D } = this.el;

    this._playerCameraWorldPosition.setFromMatrixPosition(this._playerCamera.matrixWorld);
    this._worldPosition.setFromMatrixPosition(object3D.matrixWorld);
    const distance = this._worldPosition.distanceTo(this._playerCameraWorldPosition) / 10;

    const scale = Math.min(maxScale, minScale + (maxScale - minScale) * audioAnalyser.volume * 8 * distance);

    object3D.scale.setScalar(scale);
    object3D.matrixNeedsUpdate = true;
  }
});
