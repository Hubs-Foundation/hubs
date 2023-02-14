import audioDebugVert from "../systems/audio-debug.vert";
import audioDebugFrag from "../systems/audio-debug.frag";
import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { getScene, HubsWorld } from "../app";
import { AudioEmitter, NavMesh } from "../bit-components";
import { DistanceModelType } from "../components/audio-params";
import { getWebGLVersion } from "../utils/webgl";
import { isPositionalAudio } from "./audio-emitter-system";
import { Mesh, Material, Vector3, ShaderMaterial } from "three";
import { disposeMaterial } from "../utils/three-utils";

const fakePanner = {
  distanceModel: DistanceModelType.Inverse,
  maxDistance: 0,
  refDistance: 0,
  rolloffFactor: 0,
  coneInnerAngle: 0,
  coneOuterAngle: 0
};

interface DebugUniforms {
  sourcePositions: Array<Vector3>;
  sourceOrientations: Array<Vector3>;
  distanceModels: Array<number>;
  maxDistances: Array<number>;
  refDistances: Array<number>;
  rolloffFactors: Array<number>;
  coneInnerAngles: Array<number>;
  coneOuterAngles: Array<number>;
  gains: Array<number>;
  clipped: Array<number>;
}

const nav2uni = new Map<number, DebugUniforms>();

let isEnabled = false;
let unsupported = false;
let maxDebugSources = 64;

const DEBUG_MATERIAL = new THREE.ShaderMaterial({
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
DEBUG_MATERIAL.side = THREE.FrontSide;
DEBUG_MATERIAL.transparent = true;
DEBUG_MATERIAL.uniforms.count.value = 0;
const nav2mat = new Map<number, Material | Material[]>();

const addDebugMaterial = (world: HubsWorld, nav: number) => {
  if (nav2mat.has(nav)) return;
  const obj = world.eid2obj.get(nav);
  if (obj) {
    const navMesh = obj as Mesh;
    navMesh.visible = isEnabled;
    nav2mat.set(nav, navMesh.material);
    nav2uni.set(nav, {
      sourcePositions: new Array<Vector3>(maxDebugSources).fill(new Vector3()),
      sourceOrientations: new Array<Vector3>(maxDebugSources).fill(new Vector3()),
      distanceModels: new Array<number>(maxDebugSources).fill(0),
      maxDistances: new Array<number>(maxDebugSources).fill(0),
      refDistances: new Array<number>(maxDebugSources).fill(0),
      rolloffFactors: new Array<number>(maxDebugSources).fill(0),
      coneInnerAngles: new Array<number>(maxDebugSources).fill(0),
      coneOuterAngles: new Array<number>(maxDebugSources).fill(0),
      gains: new Array<number>(maxDebugSources).fill(0),
      clipped: new Array<number>(maxDebugSources).fill(0)
    } as DebugUniforms);
    navMesh.material = DEBUG_MATERIAL;
    navMesh.material.needsUpdate = true;
    navMesh.geometry.computeVertexNormals();
  }
};

const removeDebugMaterial = (world: HubsWorld, nav: number) => {
  if (!nav2mat.has(nav)) return;
  const obj = world.eid2obj.get(nav);
  if (obj) {
    const navMesh = obj as Mesh;
    navMesh.visible = false;
    disposeMaterial(navMesh.material);
    navMesh.material = nav2mat.get(nav)!;
    nav2mat.delete(nav);
    nav2uni.delete(nav);
    (navMesh.material as Material).needsUpdate = true;
    navMesh.geometry.computeVertexNormals();
  }
};

export const cleanupAudioDebugNavMesh = (nav: number) => removeDebugMaterial(APP.world, nav);

getScene().then(() => {
  const webGLVersion = getWebGLVersion(APP.scene!.renderer);
  if (webGLVersion < "2.0") {
    unsupported = true;
  } else {
    const gl = APP.scene!.renderer.getContext();
    const maxUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    // 10 is the number of uniform vectors in the shader. If we update that, this number must be updated accordingly.
    maxDebugSources = Math.min(Math.floor(maxUniformVectors / 10), maxDebugSources);
    DEBUG_MATERIAL.defines.MAX_DEBUG_SOURCES = maxDebugSources;
  }

  (APP.store as any).addEventListener("statechanged", () => {
    isEnabled = APP.store.state.preferences.showAudioDebugPanel;
    defineQuery([NavMesh])(APP.world).forEach(nav => {
      if (!unsupported) {
        if (isEnabled) {
          addDebugMaterial(APP.world, nav);
        } else {
          removeDebugMaterial(APP.world, nav);
        }
      }
    });
  });

  isEnabled = APP.store.state.preferences.showAudioDebugPanel;
});

const sourcePos = new THREE.Vector3();
const sourceDir = new THREE.Vector3();
const audioEmittersQuery = defineQuery([AudioEmitter]);
const navMeshQuery = defineQuery([NavMesh]);
const navMeshEnterQuery = enterQuery(navMeshQuery);
const navMeshExitQuery = exitQuery(navMeshQuery);
export function audioDebugSystem(world: HubsWorld) {
  navMeshEnterQuery(world).forEach(nav => {
    isEnabled && !unsupported && addDebugMaterial(world, nav);
  });
  navMeshExitQuery(world).forEach(nav => {
    removeDebugMaterial(world, nav);
  });
  let idx = 0;
  if (isEnabled && !unsupported) {
    audioEmittersQuery(world).forEach(emitter => {
      if (APP.isAudioPaused.has(emitter)) return;
      if (idx >= maxDebugSources) return;

      const audio = APP.audios.get(emitter)!;

      audio.getWorldPosition(sourcePos);
      audio.getWorldDirection(sourceDir);

      const panner = isPositionalAudio(audio) ? audio.panner : fakePanner;

      nav2uni.forEach((uniforms: DebugUniforms, nav: number) => {
        const navMesh = world.eid2obj.get(nav)! as Mesh;
        uniforms.sourcePositions[idx] = navMesh.worldToLocal(sourcePos).clone(); // TODO: Use Vector3 pool
        uniforms.sourceOrientations[idx] = navMesh.worldToLocal(sourceDir).clone();
        uniforms.distanceModels[idx] = 0;
        if (panner.distanceModel === DistanceModelType.Linear) {
          uniforms.distanceModels[idx] = 0;
        } else if (panner.distanceModel === DistanceModelType.Inverse) {
          uniforms.distanceModels[idx] = 1;
        } else if (panner.distanceModel === DistanceModelType.Exponential) {
          uniforms.distanceModels[idx] = 2;
        }
        uniforms.maxDistances[idx] = panner.maxDistance;
        uniforms.refDistances[idx] = panner.refDistance;
        uniforms.rolloffFactors[idx] = panner.rolloffFactor;
        uniforms.coneInnerAngles[idx] = panner.coneInnerAngle;
        uniforms.coneOuterAngles[idx] = panner.coneOuterAngle;
        uniforms.gains[idx] = audio.gain.gain.value;
        uniforms.clipped[idx] = APP.clippingState.has(emitter) ? 1 : 0;
      });
      idx++;
    });
    nav2uni.forEach((uniforms: DebugUniforms, nav: number) => {
      const navMesh = world.eid2obj.get(nav)! as Mesh;
      const debugMaterial = navMesh.material as ShaderMaterial;
      debugMaterial.uniforms.time.value = world.time.elapsed;
      debugMaterial.uniforms.distanceModel.value = uniforms.distanceModels;
      debugMaterial.uniforms.maxDistance.value = uniforms.maxDistances;
      debugMaterial.uniforms.refDistance.value = uniforms.refDistances;
      debugMaterial.uniforms.rolloffFactor.value = uniforms.rolloffFactors;
      debugMaterial.uniforms.sourcePosition.value = uniforms.sourcePositions;
      debugMaterial.uniforms.sourceOrientation.value = uniforms.sourceOrientations;
      debugMaterial.uniforms.count.value = idx;
      debugMaterial.uniforms.coneInnerAngle.value = uniforms.coneInnerAngles;
      debugMaterial.uniforms.coneOuterAngle.value = uniforms.coneOuterAngles;
      debugMaterial.uniforms.gain.value = uniforms.gains;
      debugMaterial.uniforms.clipped.value = uniforms.clipped;
      debugMaterial.uniformsNeedUpdate = true;
    });
  }
}
