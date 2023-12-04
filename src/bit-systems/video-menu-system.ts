import { addComponent, defineQuery, entityExists, hasComponent, removeComponent } from "bitecs";
import { Object3D, Plane, Ray, Vector3 } from "three";
import { clamp, mapLinear } from "three/src/math/MathUtils";
import { Text as TroikaText } from "troika-three-text";
import { HubsWorld } from "../app";
import {
  CursorRaycastable,
  EntityStateDirty,
  Held,
  HeldRemoteRight,
  HoveredRemoteRight,
  Interacted,
  MediaVideo,
  MediaVideoData,
  NetworkedVideo,
  ObjectMenuTransform,
  VideoMenu
} from "../bit-components";
import { timeFmt } from "../components/media-video";
import { takeOwnership } from "../utils/take-ownership";
import { paths } from "../systems/userinput/paths";
import { isFacingCamera } from "../utils/three-utils";
import { Emitter2Audio } from "./audio-emitter-system";
import { EntityID } from "../utils/networking-types";
import { findAncestorWithComponent, hasAnyComponent } from "../utils/bit-utils";
import { ObjectMenuTransformFlags } from "../inflators/object-menu-transform";

const videoMenuQuery = defineQuery([VideoMenu]);
const hoveredQuery = defineQuery([HoveredRemoteRight]);
const sliderHalfWidth = 0.475;

function setCursorRaycastable(world: HubsWorld, menu: number, enable: boolean) {
  let change = enable ? addComponent : removeComponent;
  change(world, CursorRaycastable, menu);
  change(world, CursorRaycastable, VideoMenu.trackRef[menu]);
}

const intersectInThePlaneOf = (() => {
  const plane = new Plane();
  const ray = new Ray();
  type Pose = { position: Vector3; direction: Vector3 };
  return function intersectInThePlaneOf(obj: Object3D, { position, direction }: Pose, intersection: Vector3) {
    ray.set(position, direction);
    plane.normal.set(0, 0, 1);
    plane.constant = 0;
    plane.applyMatrix4(obj.matrixWorld);
    ray.intersectPlane(plane, intersection);
  };
})();

type Job<T> = () => IteratorResult<undefined, T>;

function findVideoMenuTarget(world: HubsWorld, menu: EntityID, sceneIsFrozen: boolean) {
  if (VideoMenu.videoRef[menu] && !entityExists(world, VideoMenu.videoRef[menu])) {
    // Clear the invalid entity reference. (The pdf entity was removed).
    VideoMenu.videoRef[menu] = 0;
  }

  if (sceneIsFrozen) {
    VideoMenu.videoRef[menu] = 0;
    return;
  }

  const isTrackHoveredOrHeld = hasAnyComponent(world, [Held, HoveredRemoteRight], VideoMenu.trackRef[menu]);
  if (isTrackHoveredOrHeld) {
    VideoMenu.clearTargetTimer[menu] = world.time.elapsed + 1000;
    return;
  }

  const hovered = hoveredQuery(world);
  const target = hovered.map(eid => findAncestorWithComponent(world, MediaVideo, eid))[0] || 0;
  if (target) {
    VideoMenu.videoRef[menu] = target;
    VideoMenu.clearTargetTimer[menu] = world.time.elapsed + 1000;
    return;
  }

  if (hovered.some(eid => findAncestorWithComponent(world, VideoMenu, eid))) {
    VideoMenu.clearTargetTimer[menu] = world.time.elapsed + 1000;
    return;
  }

  if (world.time.elapsed > VideoMenu.clearTargetTimer[menu]) {
    VideoMenu.videoRef[menu] = 0;
    return;
  }
}

function flushToObject3Ds(world: HubsWorld, menu: EntityID, frozen: boolean) {
  const target = VideoMenu.videoRef[menu];
  const visible = !!(target && !frozen);

  const obj = world.eid2obj.get(menu)!;
  obj.visible = visible;

  // TODO We are handling menus visibility in a similar way for all the object menus, we
  // should probably refactor this to a common object-menu-visibility-system
  if (visible) {
    setCursorRaycastable(world, menu, true);
    APP.world.scene.add(obj);
    ObjectMenuTransform.targetObjectRef[menu] = target;
    ObjectMenuTransform.flags[menu] |= ObjectMenuTransformFlags.Enabled;
  } else {
    obj.removeFromParent();
    setCursorRaycastable(world, menu, false);

    ObjectMenuTransform.flags[menu] &= ~ObjectMenuTransformFlags.Enabled;
  }
}

function clicked(world: HubsWorld, eid: EntityID) {
  return hasComponent(world, Interacted, eid);
}

function handleClicks(world: HubsWorld, menu: EntityID) {
  const videoEid = VideoMenu.videoRef[menu];
  const video = MediaVideoData.get(videoEid)!;
  const audioEid = Emitter2Audio.get(videoEid)!;
  if (clicked(world, VideoMenu.playIndicatorRef[menu])) {
    video.play();
    APP.isAudioPaused.delete(audioEid);
    if (hasComponent(world, NetworkedVideo, videoEid)) {
      takeOwnership(world, videoEid);
      addComponent(world, EntityStateDirty, videoEid);
    }
  } else if (clicked(world, VideoMenu.pauseIndicatorRef[menu])) {
    video.pause();
    APP.isAudioPaused.add(audioEid);
    if (hasComponent(world, NetworkedVideo, videoEid)) {
      takeOwnership(world, videoEid);
      addComponent(world, EntityStateDirty, videoEid);
    }
  }
}

let intersectionPoint = new Vector3();
export function videoMenuSystem(world: HubsWorld, userinput: any, sceneIsFrozen: boolean) {
  const rightVideoMenu = videoMenuQuery(world)[0];
  findVideoMenuTarget(world, rightVideoMenu, sceneIsFrozen);

  videoMenuQuery(world).forEach(function (eid) {
    const videoEid = VideoMenu.videoRef[eid];
    if (!videoEid) return;
    const menuObj = world.eid2obj.get(eid)!;
    const video = MediaVideoData.get(videoEid)!;

    const playIndicatorObj = world.eid2obj.get(VideoMenu.playIndicatorRef[eid])!;
    const pauseIndicatorObj = world.eid2obj.get(VideoMenu.pauseIndicatorRef[eid])!;
    if (video.paused) {
      playIndicatorObj.visible = true;
      pauseIndicatorObj.visible = false;
    } else {
      playIndicatorObj.visible = false;
      pauseIndicatorObj.visible = true;
    }

    handleClicks(world, eid);

    const videoIsFacingCamera = isFacingCamera(world.eid2obj.get(videoEid)!);
    const yRot = videoIsFacingCamera ? 0 : Math.PI;
    if (menuObj.rotation.y !== yRot) {
      menuObj.rotation.y = yRot;
      menuObj.matrixNeedsUpdate = true;
    }

    const headObj = world.eid2obj.get(VideoMenu.headRef[eid])!;
    if (hasComponent(world, HeldRemoteRight, VideoMenu.trackRef[eid])) {
      const trackObj = world.eid2obj.get(VideoMenu.trackRef[eid])!;
      intersectInThePlaneOf(trackObj, userinput.get(paths.actions.cursor.right.pose), intersectionPoint);
      if (intersectionPoint) {
        const newPosition = headObj.parent!.worldToLocal(intersectionPoint);
        video.currentTime =
          mapLinear(clamp(newPosition.x, -sliderHalfWidth, sliderHalfWidth), -sliderHalfWidth, sliderHalfWidth, 0, 1) *
          video.duration;
      }
      if (hasComponent(world, NetworkedVideo, videoEid)) {
        takeOwnership(world, videoEid);
        addComponent(world, EntityStateDirty, videoEid);
      }
    }
    headObj.position.x = mapLinear(video.currentTime, 0, video.duration, -sliderHalfWidth, sliderHalfWidth);
    headObj.matrixNeedsUpdate = true;

    const ratio = MediaVideo.ratio[videoEid];

    const timeLabel = world.eid2obj.get(VideoMenu.timeLabelRef[eid])! as TroikaText;
    timeLabel.text = `${timeFmt(video.currentTime)} / ${timeFmt(video.duration)}`;
    timeLabel.position.setY(ratio / 2 - 0.02);
    timeLabel.matrixNeedsUpdate = true;

    const slider = world.eid2obj.get(VideoMenu.sliderRef[eid])!;
    slider.position.setY(-(ratio / 2) + 0.025);
    slider.matrixNeedsUpdate = true;
  });

  flushToObject3Ds(world, rightVideoMenu, sceneIsFrozen);
}
