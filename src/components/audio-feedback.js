import { findAncestorWithComponent } from "../utils/scene-graph";
import { waitForDOMContentLoaded } from "../utils/async-utils";
import { easeOutQuadratic } from "../utils/easing";
import { registerComponentInstance, deregisterComponentInstance } from "../utils/component-utils";

// This computation is expensive, so we run on at most one avatar per frame, including quiet avatars.
// However if we detect an avatar is seen speaking (its volume is above DISABLE_AT_VOLUME_THRESHOLD)
// then we continue analysis for at least DISABLE_GRACE_PERIOD_MS and disable doing it every frame if
// the avatar is quiet during that entire duration (eg they are muted)
const DISABLE_AT_VOLUME_THRESHOLD = 0.00001;
const DISABLE_GRACE_PERIOD_MS = 10000;
const MIN_VOLUME_THRESHOLD = 0.08;

const calculateVolume = (analyser, levels) => {
  // take care with compatibility, e.g. safari doesn't support getFloatTimeDomainData
  analyser.getByteTimeDomainData(levels);
  let sum = 0;
  for (let i = 0; i < levels.length; i++) {
    const amplitude = (levels[i] - 128) / 128;
    sum += amplitude * amplitude;
  }
  const currVolume = Math.sqrt(sum / levels.length);
  return currVolume;
};

const tempScaleFromPosition = new THREE.Vector3();
const tempScaleToPosition = new THREE.Vector3();

export function getAudioFeedbackScale(fromObject, toObject, minScale, maxScale, volume) {
  tempScaleToPosition.setFromMatrixPosition(toObject.matrixWorld);
  tempScaleFromPosition.setFromMatrixPosition(fromObject.matrixWorld);
  const distance = tempScaleFromPosition.distanceTo(tempScaleToPosition) / 10;
  return Math.min(maxScale, minScale + (maxScale - minScale) * volume * 8 * distance);
}

function updateVolume(component) {
  const newRawVolume = calculateVolume(component.analyser, component.levels);

  const newPerceivedVolume = Math.log(THREE.Math.mapLinear(newRawVolume, 0, 1, 1, Math.E));

  component.volume = newPerceivedVolume < MIN_VOLUME_THRESHOLD ? 0 : newPerceivedVolume;

  const s = component.volume > component.prevVolume ? 0.35 : 0.3;
  component.volume = s * component.volume + (1 - s) * component.prevVolume;
  component.prevVolume = component.volume;
}

/**
 * Updates a `volume` property based on a networked audio source
 * @namespace avatar
 * @component networked-audio-analyser
 */
AFRAME.registerComponent("networked-audio-analyser", {
  async init() {
    this.volume = 0;
    this.prevVolume = 0;
    this.avatarIsQuiet = true;

    this._updateAnalysis = this._updateAnalysis.bind(this);
    this._runScheduledWork = this._runScheduledWork.bind(this);
    this.el.sceneEl.systems["frame-scheduler"].schedule(this._runScheduledWork, "audio-analyser");
    this.el.addEventListener(
      "sound-source-set",
      event => {
        const ctx = THREE.AudioContext.getContext();
        this.analyser = ctx.createAnalyser();
        this.analyser.fftSize = 32;
        this.levels = new Uint8Array(this.analyser.fftSize);
        event.detail.soundSource.connect(this.analyser);
      },
      { once: true }
    );

    this.playerSessionId = findAncestorWithComponent(this.el, "player-info").components["player-info"].playerSessionId;
    registerComponentInstance(this, "networked-audio-analyser");
  },

  remove: function() {
    deregisterComponentInstance(this, "networked-audio-analyser");
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

    updateVolume(this);

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

function getAnalyser(el) {
  // Is this the local player
  const ikRootEl = findAncestorWithComponent(el, "ik-root");
  if (ikRootEl && ikRootEl.id === "avatar-rig") {
    return el.sceneEl.systems["local-audio-analyser"];
  } else {
    const analyserEl = findAncestorWithComponent(el, "networked-audio-analyser");
    if (!analyserEl) return null;
    return analyserEl.components["networked-audio-analyser"];
  }
}

/**
 * Calculates volume of the local audio stream.
 */
AFRAME.registerSystem("local-audio-analyser", {
  init() {
    this.volume = 0;
    this.prevVolume = 0;

    this.el.addEventListener("local-media-stream-created", () => {
      const audioSystem = this.el.sceneEl.systems["hubs-systems"].audioSystem;
      this.analyser = audioSystem.outboundAnalyser;
      this.levels = audioSystem.analyserLevels;
    });
  },

  tick: function() {
    if (!this.analyser) return;
    updateVolume(this);
  }
});

/**
 * Sets an entity's scale base on the volume of an audio-analyser in a parent entity.
 * @namespace avatar
 * @component scale-audio-feedback
 */
AFRAME.registerComponent("scale-audio-feedback", {
  schema: {
    minScale: { default: 1 },
    maxScale: { default: 1.5 }
  },

  async init() {
    await waitForDOMContentLoaded();
    this.cameraEl = document.getElementById("viewing-camera");
  },

  tick() {
    // TODO: come up with a cleaner way to handle this.
    // bone's are "hidden" by scaling them with bone-visibility, without this we would overwrite that.
    if (!this.el.object3D.visible) return;
    if (!this.cameraEl) return;
    if (!this.analyser) this.analyser = getAnalyser(this.el);

    const { minScale, maxScale } = this.data;

    const { object3D } = this.el;

    const scale = getAudioFeedbackScale(
      this.el.object3D,
      this.cameraEl.object3DMap.camera,
      minScale,
      maxScale,
      this.analyser ? this.analyser.volume : 0
    );

    object3D.scale.setScalar(scale);
    object3D.matrixNeedsUpdate = true;
  }
});

/**
 * Animates a morph target based on an audio-analyser in a parent entity
 * @namespace avatar
 * @component morph-audio-feedback
 */
AFRAME.registerComponent("morph-audio-feedback", {
  schema: {
    name: { default: "" },
    minValue: { default: 0 },
    maxValue: { default: 2 }
  },

  init() {
    const meshes = [];
    if (this.el.object3DMap.skinnedmesh) {
      meshes.push(this.el.object3DMap.skinnedmesh);
    } else if (this.el.object3DMap.group) {
      // skinned mesh with multiple materials
      this.el.object3DMap.group.traverse(o => o.isSkinnedMesh && meshes.push(o));
    }
    if (meshes.length) {
      this.morphs = meshes
        .map(mesh => ({ mesh, morphNumber: mesh.morphTargetDictionary[this.data.name] }))
        .filter(m => m.morphNumber !== undefined);
    }
  },

  tick() {
    if (!this.morphs.length) return;

    if (!this.analyser) this.analyser = getAnalyser(this.el);

    const { minValue, maxValue } = this.data;
    const morphValue = THREE.Math.mapLinear(
      easeOutQuadratic(this.analyser ? this.analyser.volume : 0),
      0,
      1,
      minValue,
      maxValue
    );
    for (let i = 0; i < this.morphs.length; i++) {
      this.morphs[i].mesh.morphTargetInfluences[this.morphs[i].morphNumber] = morphValue;
    }
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

export function micLevelForVolume(volume) {
  return THREE.Math.clamp(Math.ceil(THREE.Math.mapLinear(volume - 0.05, 0, 1, 0, 7)), 0, 7);
}

AFRAME.registerComponent("mic-button", {
  schema: {
    active: { type: "boolean" },
    tooltip: { type: "selector" },
    tooltipText: { type: "string" },
    activeTooltipText: { type: "string" }
  },

  init() {
    this.prevSpriteName = "";
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
    const active = this.data.active;
    const hovering = this.hovering;
    const spriteNames =
      SPRITE_NAMES[!active ? (hovering ? "MIC_HOVER" : "MIC") : hovering ? "MIC_OFF_HOVER" : "MIC_OFF"];
    const level = micLevelForVolume(audioAnalyser.volume);
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
