// This computation is expensive, so we run on at most one avatar per frame, including quiet avatars.
// However if we detect an avatar is seen speaking (its volume is above DISABLE_AT_VOLUME_THRESHOLD)
// then we continue analysis for at least DISABLE_GRACE_PERIOD_MS and disable doing it every frame if
// the avatar is quiet during that entire duration (eg they are muted)
const DISABLE_AT_VOLUME_THRESHOLD = 0.00001;
const DISABLE_GRACE_PERIOD_MS = 10000;
const MIN_VOLUME_THRESHOLD = 0.01;

const calculateVolume = (analyser, levels) => {
  // take care with compatibility, e.g. safari doesn't support getFloatTimeDomainData
  analyser.getByteTimeDomainData(levels);
  let sum = 0;
  for (let i = 0; i < levels.length; i++) {
    const amplitude = (levels[i] - 128) / 128;
    sum += amplitude * amplitude;
  }
  const currVolume = Math.sqrt(sum / levels.length);
  return currVolume < MIN_VOLUME_THRESHOLD ? 0 : currVolume;
};

const tempScaleFromPosition = new THREE.Vector3();
const tempScaleToPosition = new THREE.Vector3();

export function getAudioFeedbackScale(fromObject, toObject, minScale, maxScale, volume) {
  tempScaleToPosition.setFromMatrixPosition(toObject.matrixWorld);
  tempScaleFromPosition.setFromMatrixPosition(fromObject.matrixWorld);
  const distance = tempScaleFromPosition.distanceTo(tempScaleToPosition) / 10;
  return Math.min(maxScale, minScale + (maxScale - minScale) * volume * 8 * distance);
}

/**
 * Emits audioFrequencyChange events based on a networked audio source
 * @namespace avatar
 * @component networked-audio-analyser
 */
AFRAME.registerComponent("networked-audio-analyser", {
  async init() {
    this.volume = 0;
    this.prevVolume = 0;
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

    const currentVolume = calculateVolume(this.analyser, this.levels);
    const s = 0.3;
    this.volume = s * currentVolume + (1 - s) * this.prevVolume;
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

function connectAnalyser(mediaStream) {
  const ctx = THREE.AudioContext.getContext();
  const source = ctx.createMediaStreamSource(mediaStream);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 32;
  const levels = new Uint8Array(analyser.frequencyBinCount);
  source.connect(analyser);
  return { analyser, levels };
}

/**
 * Calculates volume of the local audio stream.
 */
AFRAME.registerSystem("local-audio-analyser", {
  init() {
    this.volume = 0;

    this.el.addEventListener("local-media-stream-created", e => {
      const mediaStream = e.detail.mediaStream;
      if (this.stream) {
        console.warn("media stream changed", this.stream, mediaStream);
        // TODO: cleanup?
      }
      this.stream = mediaStream;
      const { analyser, levels } = connectAnalyser(mediaStream);
      this.analyser = analyser;
      this.levels = levels;
    });
  },

  tick: function() {
    if (!this.analyser) return;
    this.volume = calculateVolume(this.analyser, this.levels);
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
    this.camera = document.getElementById("viewing-camera").object3D;
  },

  tick() {
    // TODO: come up with a cleaner way to handle this.
    // bone's are "hidden" by scaling them with bone-visibility, without this we would overwrite that.
    if (!this.el.object3D.visible) return;

    const { minScale, maxScale } = this.data;

    const audioAnalyser = this.el.components["networked-audio-analyser"];

    if (!audioAnalyser) return;

    const { object3D } = this.el;

    const scale = getAudioFeedbackScale(this.el.object3D, this.camera, minScale, maxScale, audioAnalyser.volume);

    object3D.scale.setScalar(scale);
    object3D.matrixNeedsUpdate = true;
  }
});

const SPRITE_NAMES = {
  MIC: ["mic-0.png", "mic-1.png", "mic-2.png", "mic-3.png", "mic-4.png", "mic-5.png", "mic-6.png", "mic-7.png"],
  MIC_HOVER: [
    "mic-0_hover.png",
    "mic-1_hover.png",
    "mic-2_hover.png",
    "mic-3_hover.png",
    "mic-4_hover.png",
    "mic-5_hover.png",
    "mic-6_hover.png",
    "mic-7_hover.png"
  ],
  MIC_OFF: [
    "mic-off-0.png",
    "mic-off-1.png",
    "mic-off-2.png",
    "mic-off-3.png",
    "mic-off-4.png",
    "mic-off-5.png",
    "mic-off-6.png",
    "mic-off-7.png"
  ],
  MIC_OFF_HOVER: [
    "mic-off-0_hover.png",
    "mic-off-1_hover.png",
    "mic-off-2_hover.png",
    "mic-off-3_hover.png",
    "mic-off-4_hover.png",
    "mic-off-5_hover.png",
    "mic-off-6_hover.png",
    "mic-off-7_hover.png"
  ]
};

export function micLevelForVolume(volume, max) {
  return max === 0
    ? 0
    : volume < max * 0.02
      ? 0
      : volume < max * 0.03
        ? 1
        : volume < max * 0.06
          ? 2
          : volume < max * 0.08
            ? 3
            : volume < max * 0.16
              ? 4
              : volume < max * 0.32
                ? 5
                : volume < max * 0.5
                  ? 6
                  : 7;
}

AFRAME.registerComponent("mic-button", {
  schema: {
    active: { type: "boolean" },
    tooltip: { type: "selector" },
    tooltipText: { type: "string" },
    activeTooltipText: { type: "string" }
  },

  init() {
    this.loudest = 0;
    this.prevSpriteName = "";
    this.decayingVolume = 0;
    this.el.object3D.matrixNeedsUpdate = true;
    this.hovering = false;
    this.onHover = () => {
      this.hovering = true;
      this.data.tooltip.setAttribute("visible", true);
    };
    this.onHoverOut = () => {
      this.hovering = false;
      this.data.tooltip.setAttribute("visible", false);
    };
  },

  play() {
    this.el.object3D.addEventListener("hovered", this.onHover);
    this.el.object3D.addEventListener("unhovered", this.onHoverOut);
  },

  pause() {
    this.el.object3D.removeEventListener("hovered", this.onHover);
    this.el.object3D.removeEventListener("unhovered", this.onHoverOut);
  },

  update() {
    if (this.data.tooltip) {
      this.textEl = this.data.tooltip.querySelector("[text]");
    }
  },

  tick() {
    const audioAnalyser = this.el.sceneEl.systems["local-audio-analyser"];
    let volume;
    if (audioAnalyser.volume > this.decayingVolume) {
      this.decayingVolume = audioAnalyser.volume;
      volume = audioAnalyser.volume;
      this.loudest = Math.max(this.loudest, volume);
    } else {
      const s = 0.8;
      volume = this.decayingVolume * s > 0.001 ? this.decayingVolume * s : 0;
      this.decayingVolume = volume;
    }

    const active = this.data.active;
    const hovering = this.hovering;
    const spriteNames =
      SPRITE_NAMES[!active ? (hovering ? "MIC_HOVER" : "MIC") : hovering ? "MIC_OFF_HOVER" : "MIC_OFF"];
    const level = micLevelForVolume(volume, this.loudest);
    const spriteName = spriteNames[level];
    if (spriteName !== this.prevSpriteName) {
      this.prevSpriteName = spriteName;
      this.el.setAttribute("sprite", "name", spriteName);
    }

    if (this.data.tooltip && hovering) {
      this.textEl = this.textEl || this.data.tooltip.querySelector("[text]");
      this.textEl.setAttribute("text", "value", active ? this.data.activeTooltipText : this.data.tooltipText);
    }
  }
});
