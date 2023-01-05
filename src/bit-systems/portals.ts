import { defineQuery, enterQuery, exitQuery, removeEntity } from "bitecs";
import {
  Box3,
  MathUtils,
  Scene,
  ShaderMaterial,
  Vector3,
  Matrix4,
  Quaternion,
  Object3D,
  Camera,
  Mesh,
  Box3Helper,
  Color,
  PerspectiveCamera,
  WebGLRenderTarget
} from "three";
import { degToRad } from "three/src/math/MathUtils";
import { HubsWorld } from "../app";
import { Portal } from "../bit-components";
import { Layers } from "../camera-layers";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import qsTruthy from "../utils/qs_truthy";
import { changeHub } from "../change-hub";
import { AScene } from "aframe";

const helpers = new Map();
const AABBS = new Map();
const renderTargets = new Map();
const cameras = new Map();

const offset = new Vector3();
const bounds = new Vector3();
const listenerPosition = new Vector3();
const tmpMat = new Matrix4();
const targetMat = new Matrix4().identity();
const tmpQuat = new Quaternion();
const avatarPos = new Vector3();
const portalPos = new Vector3();
const yUp = new Vector3(0, 1, 0);
const objWorldDir = new Vector3();

const TURN = new Matrix4().makeRotationY(degToRad(180));

const portalsQuery = defineQuery([Portal]);
const portalsEnterQuery = enterQuery(portalsQuery);
const portalsExitQuery = exitQuery(portalsQuery);

const DEBUG = qsTruthy("debugPortals");
export const PORTAL_RENDER_WIDTH = 1024;
export const PORTAL_RENDER_HEIGHT = 1024;

let running = false;
export const startPortalSystem = () => {
  running = true;
};
export const stopPortalSystem = () => {
  running = false;
};

const hubsRoomRegex = /(https?:\/\/)?[^\/]+\/hub.html\?hub_id=(?<id>[a-zA-Z0-9]{7})(?:.*)/;

const screenPos = new Vector3();
function toScreenPosition(obj: Object3D, camera: Camera) {
  var widthHalf = 0.5 * APP.scene?.renderer.domElement.width!;
  var heightHalf = 0.5 * APP.scene?.renderer.domElement.height!;

  obj.updateMatrixWorld();
  screenPos.setFromMatrixPosition(obj.matrixWorld);
  screenPos.project(camera);

  screenPos.x = screenPos.x * widthHalf + widthHalf;
  screenPos.y = screenPos.y * heightHalf + heightHalf;

  return {
    x: screenPos.x,
    y: screenPos.y
  };
}

const remotePortal = async (src: string) => {
  let hubId = src.match(hubsRoomRegex)?.groups?.id;
  if (hubId) {
    const url = new URL(src);
    const waypoint = url.hash && url.hash.substring(1);
    // move to new room without page load or entry flow
    changeHub(hubId, true, waypoint as any);
  }
};

function updateRenderTarget(world: HubsWorld, portals: number[], source: number, target: number) {
  const obj = <Mesh>world.eid2obj.get(source)!;
  const shader = obj.material as ShaderMaterial;
  shader.uniforms.iTime.value = world.time.elapsed / 1000;
  shader.uniformsNeedUpdate = true;

  const isLocal = Portal.local[source];
  if (!isLocal) return;

  const sceneEl = AFRAME.scenes[0];
  const renderer = AFRAME.scenes[0].renderer;

  const tmpVRFlag = renderer.xr.enabled;
  renderer.xr.enabled = false;

  // TODO we are doing this because aframe uses this hook for tock.
  // Namely to capture what camera was rendering. We don't actually use that in any of our tocks.
  // Also tock can likely go away as a concept since we can just direclty order things after render in raf if we want to.
  const tmpOnAfterRender = sceneEl.object3D.onAfterRender;
  sceneEl.object3D.onAfterRender = () => {};

  // TODO this assumption is now not true since we are not running after render. We should probably just permentently turn of autoUpdate and run matrix updates at a point we wnat to.
  // The entire scene graph matrices should already be updated
  // in tick(). They don't need to be recomputed again in tock().
  const tmpAutoUpdate = sceneEl.object3D.autoUpdate;
  sceneEl.object3D.autoUpdate = false;

  const renderTarget = renderTargets.get(source);
  renderTarget.needsUpdate = false;
  renderTarget.lastUpdated = world.time.elapsed;

  const tmpRenderTarget = renderer.getRenderTarget();
  renderer.setRenderTarget(renderTarget);
  renderer.clearDepth();
  portals.forEach(p => {
    if (p === target) {
      const obj = world.eid2obj.get(p);
      if (obj) obj.visible = false;
    }
  });
  renderer.render(sceneEl.object3D, cameras.get(target));
  portals.forEach(p => {
    if (p === target) {
      const obj = world.eid2obj.get(p);
      if (obj) obj.visible = true;
    }
  });
  renderer.setRenderTarget(tmpRenderTarget);

  renderer.xr.enabled = tmpVRFlag;
  sceneEl.object3D.onAfterRender = tmpOnAfterRender;
  sceneEl.object3D.autoUpdate = tmpAutoUpdate;
}

export function portalsSystem(world: HubsWorld, scene: Scene, characterController: CharacterControllerSystem) {
  portalsEnterQuery(world).forEach(portal => {
    const AABB = new Box3();
    AABBS.set(portal, AABB);
    if (DEBUG) {
      const helper = new Box3Helper(AABB, new Color(0xffff00));
      helpers.set(portal, helper);
      scene.add(helper);
    }

    Portal.wasInside[portal] = 1;

    // Add cameras and render targets
    const obj = <Mesh>world.eid2obj.get(portal)!;

    const camera = new PerspectiveCamera(80, PORTAL_RENDER_WIDTH / PORTAL_RENDER_HEIGHT, 0.1, 1000);
    camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);
    camera.layers.enable(Layers.CAMERA_LAYER_VIDEO_TEXTURE_TARGET);
    camera.matrixAutoUpdate = true;
    obj.add(camera);
    cameras.set(portal, camera);

    const shaderMat = obj.material as ShaderMaterial;
    const renderTarget = new WebGLRenderTarget(PORTAL_RENDER_WIDTH, PORTAL_RENDER_HEIGHT, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.sRGBEncoding
    });
    shaderMat.needsUpdate = true;

    // Only update the renderTarget when the screens are in view
    function setRenderTargetDirty() {
      shaderMat.needsUpdate = true;
    }

    const isLocal = Portal.local[portal];

    if (isLocal) shaderMat.uniforms.iChannel0.value = renderTarget.texture;
    shaderMat.uniforms.iResolution.value.set(PORTAL_RENDER_WIDTH, PORTAL_RENDER_HEIGHT, 1);
    shaderMat.uniformsNeedUpdate = true;
    obj.onBeforeRender = setRenderTargetDirty;

    renderTargets.set(portal, renderTarget);
  });

  portalsExitQuery(world).forEach(portal => {
    removeEntity(world, portal);
    helpers.delete(portal);
    AABBS.delete(portal);

    const renderTarget = renderTargets.get(portal);
    renderTarget.dispose();
    renderTargets.delete(portal);

    cameras.delete(portal);
  });

  const aScene: AScene = document.querySelector("a-scene")! as AScene;
  const updateState = !aScene.is("entered") || !running;

  const portals = portalsQuery(world);
  portals.forEach(portal => {
    const obj = world.eid2obj.get(portal)!;
    const boundsProp = Portal.bounds[portal];
    const offsetProp = Portal.offset[portal];
    offset.set(offsetProp[0], offsetProp[1], offsetProp[2]);
    bounds.set(boundsProp[0], boundsProp[1], boundsProp[2]);

    const AABB = AABBS.get(portal);
    AABB.setFromCenterAndSize(offset, bounds).applyMatrix4(obj.matrixWorld);

    // Update in/out state
    APP.audioListener.getWorldPosition(listenerPosition);
    const isInside = AABB.containsPoint(listenerPosition) ? 1 : 0;
    let execute = false;
    if (isInside !== Portal.isInside[portal] && isInside !== Portal.wasInside[portal]) {
      DEBUG && console.log(`You are ${isInside ? "inside" : "outside"} the portal`);
      execute = true;
    }
    Portal.wasInside[portal] = Portal.isInside[portal];
    Portal.isInside[portal] = AABB.containsPoint(listenerPosition) ? 1 : 0;

    const isLocal = Portal.local[portal];
    const target = Portal.target[portal];
    const targetPortal = portals.find(otherPortal => {
      return otherPortal !== portal && Portal.uuid[otherPortal] === target;
    })!;

    updateRenderTarget(world, portals, portal, targetPortal);
    if (updateState) return;

    const avatarPOV = characterController?.avatarPOV as any;
    if (isLocal) {
      const targetObj = world.eid2obj.get(targetPortal);

      obj.getWorldPosition(portalPos).setY(0);
      avatarPOV.object3D.getWorldPosition(avatarPos).setY(0);
      const lookAtDir = portalPos.sub(avatarPos);
      obj.getWorldDirection(objWorldDir);

      let angle = -Math.acos(lookAtDir.normalize().dot(objWorldDir));
      const cross = lookAtDir.cross(objWorldDir);
      if (yUp.dot(cross) < 0) {
        angle = -angle;
      }
      const targetCamera = cameras.get(targetPortal);
      targetCamera.rotation.y = angle * 0.18;

      if (targetObj && execute) {
        targetObj.updateMatrixWorld(true);
        tmpMat.makeTranslation(0, 0, bounds.z * 1.1);
        targetMat.copy(targetObj.matrixWorld).multiply(TURN).multiply(tmpMat);
        tmpQuat.copy(avatarPOV.object3D.quaternion);
        characterController.travelByWaypoint(targetMat, true, false);
        avatarPOV.object3D.quaternion.copy(tmpQuat);
        avatarPOV.object3D.updateMatrices();
      }
    } else {
      const portal2DPos = toScreenPosition(obj, APP.scene!.camera);
      APP.transition.setPos(portal2DPos.x, portal2DPos.y);

      if (execute) {
        remotePortal(APP.getString(target) as string);
      } else {
        obj.getWorldPosition(portalPos);
        avatarPOV.object3D.getWorldPosition(avatarPos);
        let distance = avatarPos.distanceTo(portalPos) - bounds.z / 2;
        if (distance <= 1.1) {
          distance = MathUtils.clamp(distance, 0, 1);
          APP.transition.setTransitionStep(1 - distance);
        }
      }
    }
  });
}
