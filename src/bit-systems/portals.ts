//@ts-nocheck

import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, removeEntity } from "bitecs";
import { Box3, MathUtils, Scene, Vector3 } from "three";
import { degToRad } from "three/src/math/MathUtils";
import { HubsWorld } from "../app";
import { Portal } from "../bit-components";
import { Layers } from "../camera-layers";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import qsTruthy from "../utils/qs_truthy";
import noiseSrc from "../assets/images/portal_noise.png";
import { isHubsRoomUrl, isLocalHubsUrl } from "../utils/media-url-utils";
import { changeHub } from "../change-hub";
import { handleExitTo2DInterstitial } from "../utils/vr-interstitial";

const helpers = new Map();
const AABBS = new Map();
const renderTargets = new Map();
const cameras = new Map();

const offset = new THREE.Vector3();
const bounds = new THREE.Vector3();
const listenerPosition = new THREE.Vector3();
const tmpMat = new THREE.Matrix4();
const targetMat = new THREE.Matrix4().identity();
const tmpQuat = new THREE.Quaternion();
const avatarPos = new THREE.Vector3();
const portalPos = new THREE.Vector3();
const yUp = new THREE.Vector3(0, 1, 0);
const objWorldDir = new THREE.Vector3();

const TURN = new THREE.Matrix4().makeRotationY(degToRad(180));

const portalsQuery = defineQuery([Portal]);
const portalsEnterQuery = enterQuery(portalsQuery);
const portalsExitQuery = exitQuery(portalsQuery);

const DEBUG = qsTruthy("debugPortals");
export const PORTAL_RENDER_WIDTH = 1024;
export const PORTAL_RENDER_HEIGHT = 1024;

const loader = new THREE.TextureLoader();
const noiseTexture = loader.load(noiseSrc);
noiseTexture.minFilter = THREE.NearestFilter;
noiseTexture.magFilter = THREE.NearestFilter;
noiseTexture.wrapS = THREE.RepeatWrapping;
noiseTexture.wrapT = THREE.RepeatWrapping;

let running = false;
export const startPortalSystem = () => {
  running = true;
};
export const stopPortalSystem = () => {
  running = false;
};

const hubsRoomRegex = /(https?:\/\/)?[^\/]+\/hub.html\?hub_id=(?<id>[a-zA-Z0-9]{7})(?:.*)/;

const screenPos = new THREE.Vector3();
function toScreenPosition(obj, camera) {
  var widthHalf = 0.5 * APP.scene.renderer.domElement.width;
  var heightHalf = 0.5 * APP.scene.renderer.domElement.height;

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

const remotePortal = async src => {
  let hubId = src.match(hubsRoomRegex)?.groups.id;
  if (hubId) {
    const url = new URL(src);
    if (url.hash && window.APP.hub.hub_id === hubId) {
      // move to waypoint w/o writing to history
      window.history.replaceState(null, null, window.location.href.split("#")[0] + url.hash);
    } else if (APP.store.state.preferences.fastRoomSwitching) {
      const waypoint = url.hash && url.hash.substring(1);
      // move to new room without page load or entry flow
      changeHub(hubId, true, waypoint);
    } else {
      await handleExitTo2DInterstitial(false, () => {}, true);
      location.href = src;
    }
  }
};

function updateRenderTarget(world, portals, source, target) {
  const obj = <THREE.Mesh>world.eid2obj.get(source)!;
  obj.material.uniforms.iTime.value = world.time.elapsed / 1000;
  obj.material.uniformsNeedUpdate = true;

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
  delete sceneEl.object3D.onAfterRender;

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
      obj.visible = false;
    }
  });
  renderer.render(sceneEl.object3D, cameras.get(target));
  portals.forEach(p => {
    if (p === target) {
      const obj = world.eid2obj.get(p);
      obj.visible = true;
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
      const helper = new THREE.Box3Helper(AABB, new THREE.Color(0xffff00));
      helpers.set(portal, helper);
      scene.add(helper);
    }

    Portal.wasInside[portal] = true;

    // Add cameras and render targets
    const obj = <THREE.Mesh>world.eid2obj.get(portal)!;

    const camera = new THREE.PerspectiveCamera(80, PORTAL_RENDER_WIDTH / PORTAL_RENDER_HEIGHT, 0.1, 1000);
    camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);
    camera.layers.enable(Layers.CAMERA_LAYER_VIDEO_TEXTURE_TARGET);
    camera.matrixAutoUpdate = true;
    //camera.translateZ(1);
    obj.add(camera);
    cameras.set(portal, camera);

    const renderTarget = new THREE.WebGLRenderTarget(PORTAL_RENDER_WIDTH, PORTAL_RENDER_HEIGHT, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.sRGBEncoding
    });
    renderTarget.lastUpdated = 0;
    renderTarget.needsUpdate = true;

    // Only update the renderTarget when the screens are in view
    function setRenderTargetDirty() {
      renderTarget.needsUpdate = true;
    }

    const isLocal = Portal.local[portal];
    const image = Portal.image[portal];

    if (isLocal) obj.material.uniforms.iChannel1.value = renderTarget.texture;
    obj.material.uniforms.iChannel0.value = noiseTexture;
    obj.material.uniforms.iResolution.value.set(PORTAL_RENDER_WIDTH, PORTAL_RENDER_HEIGHT, 1);
    obj.material.uniformsNeedUpdate = true;
    obj.material.onBeforeRender = setRenderTargetDirty;

    renderTargets.set(portal, renderTarget);
  });

  portalsExitQuery(world).forEach(portal => {
    removeEntity(world, portal);
    const helper = helpers.get(portal);
    helpers.delete(portal);
    AABBS.delete(portal);

    const renderTarget = renderTargets.get(portal);
    renderTarget.dispose();
    renderTargets.delete(portal);

    cameras.delete(portal);
  });

  if (!document.querySelector("a-scene").is("entered") || !running) return;
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

    if (isLocal) {
      const targetObj = world.eid2obj.get(targetPortal);

      obj.getWorldPosition(portalPos).setY(0);
      characterController.avatarPOV.object3D.getWorldPosition(avatarPos).setY(0);
      const lookAtDir = portalPos.sub(avatarPos);
      obj.getWorldDirection(objWorldDir);

      let angle = Math.acos(lookAtDir.normalize().dot(objWorldDir));
      const cross = lookAtDir.cross(objWorldDir);
      if (yUp.dot(cross) < 0) {
        angle = -angle;
      }
      const targetCamera = cameras.get(targetPortal);
      targetCamera.rotation.y = angle * 0.25;

      updateRenderTarget(world, portals, portal, targetPortal);

      if (targetObj && execute) {
        targetObj.updateMatrixWorld(true);
        tmpMat.makeTranslation(0, 0, bounds.z * 1.1);
        targetMat.copy(targetObj.matrixWorld).multiply(TURN).multiply(tmpMat);
        tmpQuat.copy(characterController.avatarPOV.object3D.quaternion);
        characterController.travelByWaypoint(targetMat, true, false);
        characterController.avatarPOV.object3D.quaternion.copy(tmpQuat);
        characterController.avatarPOV.object3D.updateMatrices();
      }
    } else {
      const portal2DPos = toScreenPosition(obj, APP.scene.camera);
      APP.transition.setPos(portal2DPos.x, portal2DPos.y);

      updateRenderTarget(world, portals, portal, targetPortal);

      if (execute) {
        remotePortal(APP.getString(target));
      } else {
        obj.getWorldPosition(portalPos);
        characterController.avatarPOV.object3D.getWorldPosition(avatarPos);
        let distance = avatarPos.distanceTo(portalPos) - bounds.z / 2;
        if (distance <= 1.1) {
          distance = MathUtils.clamp(distance, 0, 1);
          APP.transition.setTransition(1 - distance);
        }
      }
    }
  });
}
