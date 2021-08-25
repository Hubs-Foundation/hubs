import { THREE } from "aframe";
import audioDebugVert from "./audio-debug.vert";
import audioDebugFrag from "./audio-debug.frag";
import { DistanceModelType } from "../components/audio-params";
import { getWebGLVersion } from "../utils/webgl";
import { getMeshes } from "../utils/aframe-utils";

const MAX_DEBUG_SOURCES = 64;

AFRAME.registerSystem("audio-debug", {
  schema: {
    enabled: { default: false }
  },

  init() {
    this.unsupported = false;
    const webGLVersion = getWebGLVersion(this.el.sceneEl.renderer);
    if (webGLVersion < "2.0") {
      this.unsupported = true;
    }

    window.APP.store.addEventListener("statechanged", this.updateState.bind(this));

    this.onSceneLoaded = this.onSceneLoaded.bind(this);
    this.el.sceneEl.addEventListener("environment-scene-loaded", this.onSceneLoaded);

    this.navMeshObject = null;
    this.sources = [];
    this.zones = [];

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        colorInner: { value: new THREE.Color("#7AFF59") },
        colorOuter: { value: new THREE.Color("#FF6340") },
        colorGain: { value: new THREE.Color("#70DBFF") },
        count: { value: 0 },
        maxDistance: { value: [] },
        refDistance: { value: [] },
        rolloffFactor: { value: [] },
        distanceModel: { value: [] },
        sourcePosition: { value: [] },
        sourceOrientation: { value: [] },
        coneInnerAngle: { value: [] },
        coneOuterAngle: { value: [] },
        gain: { value: [] },
        clipped: { value: [] }
      },
      vertexShader: audioDebugVert,
      fragmentShader: audioDebugFrag
    });
    this.material.side = THREE.FrontSide;
    this.material.transparent = true;
    this.material.uniforms.count.value = 0;
    this.material.defines.MAX_DEBUG_SOURCES = MAX_DEBUG_SOURCES;

    this.sourcePositions = new Array(MAX_DEBUG_SOURCES);
    this.sourcePositions.fill(new THREE.Vector3());
    this.sourceOrientations = new Array(MAX_DEBUG_SOURCES);
    this.sourceOrientations.fill(new THREE.Vector3());
    this.distanceModels = new Array(MAX_DEBUG_SOURCES);
    this.distanceModels.fill(0);
    this.maxDistances = new Array(MAX_DEBUG_SOURCES);
    this.maxDistances.fill(0.0);
    this.refDistances = new Array(MAX_DEBUG_SOURCES);
    this.refDistances.fill(0.0);
    this.rolloffFactors = new Array(MAX_DEBUG_SOURCES);
    this.rolloffFactors.fill(0.0);
    this.coneInnerAngles = new Array(MAX_DEBUG_SOURCES);
    this.coneInnerAngles.fill(0.0);
    this.coneOuterAngles = new Array(MAX_DEBUG_SOURCES);
    this.coneOuterAngles.fill(0.0);
    this.gains = new Array(MAX_DEBUG_SOURCES);
    this.gains.fill(0.0);
    this.clipped = new Array(MAX_DEBUG_SOURCES);
    this.clipped.fill(0.0);
  },

  remove() {
    window.APP.store.removeEventListener("statechanged", this.updateState);
    this.el.sceneEl.removeEventListener("environment-scene-loaded", this.onSceneLoaded);
  },

  registerSource(source) {
    this.sources.push(source);
  },

  unregisterSource(source) {
    const index = this.sources.indexOf(source);

    if (index !== -1) {
      this.sources.splice(index, 1);
    }
  },

  registerZone(zone) {
    this.zones.push(zone);
  },

  unregisterZone(zone) {
    const index = this.zones.indexOf(zone);

    if (index !== -1) {
      this.zones.splice(index, 1);
    }
  },

  tick(time) {
    if (!this.data.enabled) {
      return;
    }

    let sourceNum = 0;
    this.sources.forEach(source => {
      if (source.data.enabled && source.data.debuggable) {
        if (sourceNum < MAX_DEBUG_SOURCES) {
          this.sourcePositions[sourceNum] = this.navMeshObject.worldToLocal(source.data.position);
          this.sourceOrientations[sourceNum] = source.data.orientation;
          this.distanceModels[sourceNum] = 0;
          if (source.data.distanceModel === DistanceModelType.Linear) {
            this.distanceModels[sourceNum] = 0;
          } else if (source.data.distanceModel === DistanceModelType.Inverse) {
            this.distanceModels[sourceNum] = 1;
          } else if (source.data.distanceModel === DistanceModelType.Exponential) {
            this.distanceModels[sourceNum] = 2;
          }
          this.maxDistances[sourceNum] = source.data.maxDistance;
          this.refDistances[sourceNum] = source.data.refDistance;
          this.rolloffFactors[sourceNum] = source.data.rolloffFactor;
          this.coneInnerAngles[sourceNum] = source.data.coneInnerAngle;
          this.coneOuterAngles[sourceNum] = source.data.coneOuterAngle;
          this.gains[sourceNum] = source.data.gain;
          this.clipped[sourceNum] = source.data.isClipped;
          sourceNum++;
        }
      }
    });

    // Update material uniforms
    this.material.uniforms.time.value = time;
    this.material.uniforms.distanceModel.value = this.distanceModels;
    this.material.uniforms.maxDistance.value = this.maxDistances;
    this.material.uniforms.refDistance.value = this.refDistances;
    this.material.uniforms.rolloffFactor.value = this.rolloffFactors;
    this.material.uniforms.sourcePosition.value = this.sourcePositions;
    this.material.uniforms.sourceOrientation.value = this.sourceOrientations;
    this.material.uniforms.count.value = sourceNum;
    this.material.uniforms.coneInnerAngle.value = this.coneInnerAngles;
    this.material.uniforms.coneOuterAngle.value = this.coneOuterAngles;
    this.material.uniforms.gain.value = this.gains;
    this.material.uniforms.clipped.value = this.clipped;
  },

  enableDebugMode(enabled, force = false) {
    if (((enabled === undefined || enabled === this.data.enabled) && !force) || this.unsupported) return;
    this.zones.forEach(zone => {
      zone.el.setAttribute("audio-zone", "debuggable", enabled);
    });

    const collisionEntities = Array.from(this.el.sceneEl.querySelectorAll("[nav-mesh]"));
    const meshes = getMeshes(collisionEntities);

    if (meshes.length) {
      this.data.enabled = enabled;
      meshes.forEach(obj => {
        if (obj.isMesh) {
          this.navMeshObject = obj;
          obj.parent.visible = enabled;
          if (obj.material) {
            if (enabled) {
              !obj._hubs_audio_debug_prev_material && (obj._hubs_audio_debug_prev_material = obj.material);
              obj.material = this.material;
              obj.material.needsUpdate = true;
            } else if (obj._hubs_audio_debug_prev_material) {
              obj.material = obj._hubs_audio_debug_prev_material;
              obj._hubs_audio_debug_prev_material = null;
              obj.material.needsUpdate = true;
            }
            obj.geometry.computeFaceNormals();
            obj.geometry.computeVertexNormals();
          }
        }
      });
    }

    if (!this.navMeshObject) {
      this.data.enabled = false;
    }
  },

  updateState(force = false) {
    const isEnabled = window.APP.store.state.preferences.showAudioDebugPanel;
    if (force || (isEnabled !== undefined && isEnabled !== this.data.enabled)) {
      this.enableDebugMode(isEnabled, force);
    }
  },

  onSceneLoaded() {
    this.navMeshObject = null;
    this.updateState(true);
  }
});
