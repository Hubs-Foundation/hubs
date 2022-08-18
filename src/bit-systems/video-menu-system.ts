import { addComponent, defineQuery, enterQuery, hasComponent, removeComponent } from "bitecs";
import { Matrix4, Quaternion, Vector3 } from "three";
import { clamp, mapLinear } from "three/src/math/MathUtils";
import { Text as TroikaText } from "troika-three-text";
import { HubsWorld } from "../app";
import {
  CursorRaycastable,
  HeldRemoteRight,
  HoveredRemoteRight,
  Interacted,
  MediaVideo,
  NetworkedVideo,
  RemoteRight,
  VideoMenu,
  VideoMenuItem
} from "../bit-components";
import { timeFmt } from "../components/media-video";
import { takeOwnership } from "../systems/netcode";
import { anyEntityWith } from "../utils/bit-utils";
import { isFacingCamera, setMatrixWorld } from "../utils/three-utils";

function clicked(eid: number) {
  return hasComponent(APP.world, Interacted, eid);
}

const videoMenuQuery = defineQuery([VideoMenu]);
const hoverRightQuery = defineQuery([HoveredRemoteRight, MediaVideo]);
const hoverRightEnterQuery = enterQuery(hoverRightQuery);
const hoveredRemoteRightMenuButton = defineQuery([HoveredRemoteRight, VideoMenuItem]);

function setCursorRaycastable(world: HubsWorld, menu: number, enable: boolean) {
  let change = enable ? addComponent : removeComponent;
  change(world, CursorRaycastable, menu);
  change(world, CursorRaycastable, VideoMenu.playButtonRef[menu]);
  change(world, CursorRaycastable, VideoMenu.trackRef[menu]);
}

export function videoMenuSystem(world: HubsWorld) {
  const unhovered =
    !hoverRightQuery(world).length &&
    !hoveredRemoteRightMenuButton(world).length &&
    VideoMenu.videoRef[videoMenuQuery(world)[0]];
  if (unhovered) {
    const menu = videoMenuQuery(world)[0];
    const menuObj = world.eid2obj.get(menu)!;
    menuObj.removeFromParent();
    setCursorRaycastable(world, menu, false);
    VideoMenu.videoRef[menu] = 0;
  }

  hoverRightEnterQuery(world).forEach(function (eid) {
    const menu = videoMenuQuery(world)[0];
    VideoMenu.videoRef[menu] = eid;
    const menuObj = world.eid2obj.get(menu)!;
    const videoObj = world.eid2obj.get(eid)!;
    videoObj.add(menuObj);
    menuObj.matrixWorldNeedsUpdate = true; // TODO: Fix in threejs
    setCursorRaycastable(world, menu, true);
    const video = (world.eid2obj.get(eid) as any).material.map.image as HTMLVideoElement;
    const durationLabel = world.eid2obj.get(VideoMenu.durationRef[menu])! as any; // TODO: as Text
    durationLabel.text = timeFmt(video.duration);
    durationLabel.sync();
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
    const currentTimeLabel = world.eid2obj.get(VideoMenu.currentTimeRef[eid])! as TroikaText;
    currentTimeLabel.text = timeFmt(video.currentTime);
    currentTimeLabel.sync();
    const videoIsFacingCamera = isFacingCamera(world.eid2obj.get(videoEid)!);
    const menuObj = world.eid2obj.get(eid)!;
    const yRot = videoIsFacingCamera ? 0 : Math.PI;
    if (menuObj.rotation.y !== yRot) {
      menuObj.rotation.y = yRot;
      menuObj.matrixNeedsUpdate = true;
    }

    const headObj = world.eid2obj.get(VideoMenu.headRef[eid])!;
    if (hasComponent(world, HeldRemoteRight, VideoMenu.trackRef[eid])) {
      const cursorObj = world.eid2obj.get(anyEntityWith(APP.world, RemoteRight))!;
      const newPosition = headObj.parent!.worldToLocal(cursorObj.getWorldPosition(new Vector3()));
      if (hasComponent(world, NetworkedVideo, videoEid)) {
        takeOwnership(world, videoEid);
      }
      video.currentTime = mapLinear(clamp(newPosition.x, -0.5, 0.5), -0.5, 0.5, 0, 1) * video.duration;
    }
    headObj.position.x = mapLinear(video.currentTime, 0, video.duration, -0.5, 0.5);
    headObj.matrixNeedsUpdate = true;
  });
}
