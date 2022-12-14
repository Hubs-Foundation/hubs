//@ts-nocheck

import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, removeEntity } from "bitecs";
import { Box3, Scene } from "three";
import { degToRad } from "three/src/math/MathUtils";
import { HubsWorld } from "../app";
import { Portal } from "../bit-components";
import { Layers } from "../camera-layers";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import qsTruthy from "../utils/qs_truthy";

const helpers = new Map();
const AABBS = new Map();
const renderTargets = new Map();
const cameras = new Map();

const offset = new THREE.Vector3();
const bounds = new THREE.Vector3();
const listenerPosition = new THREE.Vector3();
const translationMat = new THREE.Matrix4();
const targetMat = new THREE.Matrix4().identity();

const TURN = new THREE.Matrix4().makeRotationY(degToRad(180));

const portalsQuery = defineQuery([Portal]);
const portalsEnterQuery = enterQuery(portalsQuery);
const portalsExitQuery = exitQuery(portalsQuery);

const DEBUG = qsTruthy("debugPortals");
export const PORTAL_RENDER_WIDTH = 1024;
export const PORTAL_RENDER_HEIGHT = 1024;

function updateRenderTarget(world, portals, source, target) {
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

    // Add cameras and render targets
    const obj = <THREE.Mesh>world.eid2obj.get(portal)!;

    const camera = new THREE.PerspectiveCamera(55, PORTAL_RENDER_WIDTH / PORTAL_RENDER_HEIGHT, 0.1, 1000);
    camera.layers.enable(Layers.CAMERA_LAYER_THIRD_PERSON_ONLY);
    camera.layers.enable(Layers.CAMERA_LAYER_VIDEO_TEXTURE_TARGET);
    camera.translateZ(1);
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

    obj.material.map = renderTarget.texture;
    obj.material.onBeforeRender = setRenderTargetDirty;

    renderTargets.set(portal, renderTarget);
  });

  portalsExitQuery(world).forEach(portal => {
    removeEntity(world, portal);
    const helper = helpers.get(portal);
    helpers.delete(portal);
    helper.removeFromParent();
    AABBS.delete(portal);

    const renderTarget = renderTargets.get(portal);
    renderTarget.dispose();
    renderTargets.delete(portal);

    const camera = cameras.get(portal);
    camera.removeFromParent();
    cameras.delete(portal);
  });

  const portals = portalsQuery(world);
  portals.forEach(portal => {
    const obj = world.eid2obj.get(portal)!;
    const boundsProp = Portal.bounds[portal];
    const offsetProp = Portal.offset[portal];
    offset.set(offsetProp[0], offsetProp[1], offsetProp[2]);
    bounds.set(boundsProp[0], boundsProp[1], boundsProp[2]);

    const AABB = AABBS.get(portal);
    AABB.setFromCenterAndSize(offset, bounds).applyMatrix4(obj.matrixWorld);

    const target = Portal.target[portal];
    const targetPortal = portals.find(otherPortal => {
      return otherPortal !== portal && Portal.uuid[otherPortal] === target;
    })!;
    const targetObj = world.eid2obj.get(targetPortal);

    if (!targetObj) return;

    APP.audioListener.getWorldPosition(listenerPosition);
    const isInside = AABB.containsPoint(listenerPosition) ? 1 : 0;
    if (isInside !== Portal.isInside[portal] && isInside) {
      DEBUG && console.log(`You are ${isInside ? "inside" : "outside"} the portal`);
      targetObj.updateMatrixWorld(true);
      translationMat.makeTranslation(0, 0, bounds.z * 2);
      targetMat.copy(targetObj.matrixWorld).multiply(TURN).multiply(translationMat);
      characterController.travelByWaypoint(targetMat, true, false);
    }
    Portal.isInside[portal] = AABB.containsPoint(listenerPosition) ? 1 : 0;

    updateRenderTarget(world, portals, portal, targetPortal);
  });
}
