import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent } from "bitecs";
import { Object3D, Plane, Ray, Vector3 } from "three";
import { clamp, mapLinear } from "three/src/math/MathUtils";
import { Text as TroikaText } from "troika-three-text";
import { HubsWorld } from "../app";
import {
  CursorRaycastable,
  Held,
  HeldRemoteRight,
  HoveredRemoteRight,
  Interacted,
  MediaVideo,
  NetworkedVideo,
  TextButton,
  VideoMenu,
  VideoMenuItem
} from "../bit-components";
import { timeFmt } from "../components/media-video";
import { takeOwnership } from "../systems/netcode";
import { paths } from "../systems/userinput/paths";
import { isFacingCamera } from "../utils/three-utils";

function clicked(eid: number) {
  return hasComponent(APP.world, Interacted, eid);
}

const videoMenuQuery = defineQuery([VideoMenu]);
const hoverRightQuery = defineQuery([HoveredRemoteRight, MediaVideo]);
const hoverRightEnterQuery = enterQuery(hoverRightQuery);
const hoveredRemoteRightMenuButton = defineQuery([HoveredRemoteRight, VideoMenuItem]);
const sliderHalfWidth = 0.475;

function setCursorRaycastable(world: HubsWorld, menu: number, enable: boolean) {
  let change = enable ? addComponent : removeComponent;
  change(world, CursorRaycastable, menu);
  change(world, CursorRaycastable, VideoMenu.playButtonRef[menu]);
  change(world, CursorRaycastable, VideoMenu.trackRef[menu]);
}

const intersectInThePlaneOf = (() => {
  let plane = new Plane();
  let ray = new Ray();
  type Pose = { position: Vector3; direction: Vector3 };
  return function intersectInThePlaneOf(obj: Object3D, { position, direction }: Pose, intersection: Vector3) {
    ray.set(position, direction);
    plane.normal.set(0, 0, 1);
    plane.constant = 0;
    obj.updateMatrices();
    plane.applyMatrix4(obj.matrixWorld);
    ray.intersectPlane(plane, intersection);
  };
})();

let intersectionPoint = new Vector3();
export function videoMenuSystem(world: HubsWorld, userinput: any) {
  const rightVideoMenu = videoMenuQuery(world)[0];
  const unhovered =
    !hoverRightQuery(world).length &&
    !hoveredRemoteRightMenuButton(world).length &&
    VideoMenu.videoRef[rightVideoMenu] &&
    !hasComponent(world, Held, VideoMenu.trackRef[rightVideoMenu]);
  if (unhovered) {
    // TODO: Left remote
    const menu = rightVideoMenu;
    const menuObj = world.eid2obj.get(menu)!;
    menuObj.removeFromParent();
    setCursorRaycastable(world, menu, false);
    VideoMenu.videoRef[menu] = 0;
  }

  hoverRightEnterQuery(world).forEach(function (eid) {
    const menu = rightVideoMenu;
    VideoMenu.videoRef[menu] = eid;
    const menuObj = world.eid2obj.get(menu)!;
    const videoObj = world.eid2obj.get(eid)!;
    videoObj.add(menuObj);
    menuObj.matrixWorldNeedsUpdate = true; // TODO: Fix in threejs
    setCursorRaycastable(world, menu, true);
  });

  videoMenuQuery(world).forEach(function (eid) {
    const videoEid = VideoMenu.videoRef[eid];
    if (!videoEid) return;
    const video = (world.eid2obj.get(videoEid) as any).material.map.image as HTMLVideoElement;
    if (clicked(VideoMenu.playButtonRef[eid])) {
      if (hasComponent(world, NetworkedVideo, videoEid)) {
        takeOwnership(world, videoEid);
      }
      video.paused ? video.play() : video.pause();
    }

    const menuObj = world.eid2obj.get(eid)!;
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
      }
    }
    headObj.position.x = mapLinear(video.currentTime, 0, video.duration, -sliderHalfWidth, sliderHalfWidth);
    headObj.matrixNeedsUpdate = true;

    const playButtonLabel = world.eid2obj.get(TextButton.labelRef[VideoMenu.playButtonRef[eid]])! as TroikaText;
    playButtonLabel.text = video.paused ? "Play" : "Pause";
    playButtonLabel.sync();

    const timeLabelRef = world.eid2obj.get(VideoMenu.timeLabelRef[eid])! as TroikaText;
    timeLabelRef.text = `${timeFmt(video.currentTime)} / ${timeFmt(video.duration)}`;
    timeLabelRef.sync();
  });
}
