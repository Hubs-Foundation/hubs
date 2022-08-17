import {
  Interacted,
  HoveredRemoteRight,
  MediaVideo,
  VideoMenu,
  VideoMenuItem,
  CursorRaycastable,
  NetworkedVideo
} from "../bit-components";
import { defineQuery, enterQuery, hasComponent, addComponent, removeComponent } from "bitecs";
import { HubsWorld } from "../app";
import { takeOwnership } from "../systems/netcode";
import { isFacingCamera } from "../utils/three-utils";
import { timeFmt } from "../components/media-video";

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
    const currentTimeLabel = world.eid2obj.get(VideoMenu.currentTimeRef[eid])! as any; // TODO: as Text
    currentTimeLabel.text = timeFmt(video.currentTime);
    currentTimeLabel.sync();
    const videoIsFacingCamera = isFacingCamera(world.eid2obj.get(videoEid)!);
    const menuObj = world.eid2obj.get(eid)!;
    const yRot = videoIsFacingCamera ? 0 : Math.PI;
    if (menuObj.rotation.y !== yRot) {
      menuObj.rotation.y = yRot;
      menuObj.matrixNeedsUpdate = true;
    }
  });
}
