import audioDebugVert from "../systems/audio-debug.vert";
import audioDebugFrag from "../systems/audio-debug.frag";
import { defineQuery, enterQuery, exitQuery } from "bitecs";
import { getScene, HubsWorld } from "../app";
import { NavMesh } from "../bit-components";
import { DistanceModelType } from "../components/audio-params";
import { getWebGLVersion } from "../utils/webgl";
import { AudioObject3D, isPositionalAudio } from "./audio-emitter-system";
import { Mesh, Material, Vector3, ShaderMaterial } from "three";
import { disposeMaterial } from "../utils/three-utils";
import { ElOrEid } from "../utils/bit-utils";

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

let isEnabled = false;
let unsupported = false;
let maxDebugEmitters = 64;
let uniforms: DebugUniforms;
let debugMaterial: ShaderMaterial | undefined | null;
const nav2mat = new Map<number, Material | Material[]>();

const createMaterial = () => {
  if (isEnabled) {
    if (!uniforms) {
      uniforms = {
        sourcePositions: new Array<Vector3>(maxDebugEmitters).fill(new Vector3()),
        sourceOrientations: new Array<Vector3>(maxDebugEmitters).fill(new Vector3()),
        distanceModels: new Array<number>(maxDebugEmitters).fill(0),
        maxDistances: new Array<number>(maxDebugEmitters).fill(0),
        refDistances: new Array<number>(maxDebugEmitters).fill(0),
        rolloffFactors: new Array<number>(maxDebugEmitters).fill(0),
        coneInnerAngles: new Array<number>(maxDebugEmitters).fill(0),
        coneOuterAngles: new Array<number>(maxDebugEmitters).fill(0),
        gains: new Array<number>(maxDebugEmitters).fill(0),
        clipped: new Array<number>(maxDebugEmitters).fill(0)
      } as DebugUniforms;
    }
    if (!debugMaterial) {
      debugMaterial = new THREE.ShaderMaterial({
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
      debugMaterial.side = THREE.DoubleSide;
      debugMaterial.transparent = true;
      debugMaterial.uniforms.count.value = 0;
      debugMaterial.defines.MAX_DEBUG_SOURCES = maxDebugEmitters;
    }
  }
};

const navMeshesQuery = defineQuery([NavMesh]);
getScene().then(() => {
  const webGLVersion = getWebGLVersion(APP.scene!.renderer);
  if (webGLVersion < "2.0") {
    unsupported = true;
  } else {
    const gl = APP.scene!.renderer.getContext();
    const maxUniformVectors = gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS);
    // 10 is the number of uniform vectors in the shader. If we update that, this number must be updated accordingly.
    maxDebugEmitters = Math.min(Math.floor(maxUniformVectors / 10), maxDebugEmitters);
  }
  if (unsupported) return;
  (APP.store as any).addEventListener("statechanged", () => {
    isEnabled = APP.store.state.preferences.showAudioDebugPanel;
    isEnabled && createMaterial();

    if (unsupported) return;
    const navMeshes = navMeshesQuery(APP.world);
    if (navMeshes.length > 0) {
      if (isEnabled) {
        addDebugMaterial(APP.world, navMeshes[0]);
      } else {
        removeDebugMaterial(APP.world, navMeshes[0]);
      }
    }

    if (!isEnabled && debugMaterial) {
      disposeMaterial(debugMaterial);
      debugMaterial = null;
    }
  });
  isEnabled = APP.store.state.preferences.showAudioDebugPanel;
  isEnabled && createMaterial();
});

const addDebugMaterial = (world: HubsWorld, navEid: number) => {
  const obj = world.eid2obj.get(navEid);
  if (obj) {
    // Some older scenes have the nav-mesh component as an ancestor of the mesh itself
    // TODO the "as any" here is because of incorrect type definition for getObjectByProperty. It was fixed in r145
    const navMesh = obj.getObjectByProperty("isMesh", true as any) as Mesh;
    navMesh.visible = isEnabled;
    if (nav2mat.has(navEid)) return;
    nav2mat.set(navEid, navMesh.material);
    navMesh.material = debugMaterial!;
    navMesh.material.needsUpdate = true;
    navMesh.geometry.computeVertexNormals();
  }
};

const removeDebugMaterial = (world: HubsWorld, navEid: number) => {
  const obj = world.eid2obj.get(navEid);
  if (obj) {
    // Some older scenes have the nav-mesh component as an ancestor of the mesh itself
    // TODO the "as any" here is because of incorrect type definition for getObjectByProperty. It was fixed in r145
    const navMesh = obj.getObjectByProperty("isMesh", true as any) as Mesh;
    navMesh.visible = false;
    if (!nav2mat.has(navEid)) return;
    navMesh.material = nav2mat.get(navEid)!;
    nav2mat.delete(navEid);
    (navMesh.material as Material).needsUpdate = true;
    navMesh.geometry.computeVertexNormals();
  }
};

export const cleanupAudioDebugNavMesh = (navEid: number) => removeDebugMaterial(APP.world, navEid);

const emitterPos = new THREE.Vector3();
const emitterDir = new THREE.Vector3();
const navMeshQuery = defineQuery([NavMesh]);
const navMeshEnterQuery = enterQuery(navMeshQuery);
const navMeshExitQuery = exitQuery(navMeshQuery);
export function audioDebugSystem(world: HubsWorld) {
  if (unsupported) return;

  const exitedNavMeshes = navMeshExitQuery(world);
  if (exitedNavMeshes.length > 0) {
    removeDebugMaterial(APP.world, exitedNavMeshes[0]);
  }

  const enteredNavMeshes = navMeshEnterQuery(world);
  if (enteredNavMeshes.length > 0) {
    if (isEnabled) {
      addDebugMaterial(APP.world, enteredNavMeshes[0]);
    }
  }
  if (isEnabled && uniforms) {
    let idx = 0;
    APP.audios.forEach((audio: AudioObject3D, audioEmitterId: ElOrEid) => {
      if (
        APP.isAudioPaused.has(audioEmitterId) ||
        APP.mutedState.has(audioEmitterId) ||
        APP.linkedMutedState.has(audioEmitterId)
      ) {
        return;
      }
      if (idx >= maxDebugEmitters) return;

      audio.getWorldPosition(emitterPos);
      audio.getWorldDirection(emitterDir);

      const panner = isPositionalAudio(audio) ? audio.panner : fakePanner;

      uniforms.sourcePositions[idx] = emitterPos.clone();
      uniforms.sourceOrientations[idx] = emitterDir.clone();
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
      uniforms.clipped[idx] = APP.clippingState.has(audioEmitterId) ? 1 : 0;

      idx++;
    });
    debugMaterial!.uniforms.time.value = world.time.elapsed;
    debugMaterial!.uniforms.distanceModel.value = uniforms.distanceModels;
    debugMaterial!.uniforms.maxDistance.value = uniforms.maxDistances;
    debugMaterial!.uniforms.refDistance.value = uniforms.refDistances;
    debugMaterial!.uniforms.rolloffFactor.value = uniforms.rolloffFactors;
    debugMaterial!.uniforms.sourcePosition.value = uniforms.sourcePositions;
    debugMaterial!.uniforms.sourceOrientation.value = uniforms.sourceOrientations;
    debugMaterial!.uniforms.count.value = idx;
    debugMaterial!.uniforms.coneInnerAngle.value = uniforms.coneInnerAngles;
    debugMaterial!.uniforms.coneOuterAngle.value = uniforms.coneOuterAngles;
    debugMaterial!.uniforms.gain.value = uniforms.gains;
    debugMaterial!.uniforms.clipped.value = uniforms.clipped;
  }
}
