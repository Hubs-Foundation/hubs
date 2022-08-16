import { Interacted, HoveredRemoteRight, MediaVideo, VideoMenu, VideoMenuButton } from "../bit-components";
import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import { takeOwnership } from "../systems/netcode";
import { isFacingCamera } from "../utils/three-utils";

function clicked(eid: number) {
  return hasComponent(APP.world, Interacted, eid);
}

const videoMenuQuery = defineQuery([VideoMenu]);
const videoMenuEnterQuery = enterQuery(videoMenuQuery);
const videoMenuExitQuery = exitQuery(videoMenuQuery);

const hoverRightQuery = defineQuery([HoveredRemoteRight, MediaVideo]);
const hoverRightEnterQuery = enterQuery(hoverRightQuery);

const hoveredRemoteRightMenuButton = defineQuery([HoveredRemoteRight, VideoMenuButton]);

export function videoMenuSystem(world: HubsWorld) {
  videoMenuEnterQuery(world).forEach(function (eid) {
    console.log("Hello, world!");
  });

  videoMenuExitQuery(world).forEach(function (eid) {
    console.error("Where did the video menu go?!");
  });

  if (
    !hoverRightQuery(world).length &&
    !hoveredRemoteRightMenuButton(world).length &&
    VideoMenu.videoRef[videoMenuQuery(world)[0]]
  ) {
    const menu = videoMenuQuery(world)[0];
    const menuObj = world.eid2obj.get(menu)!;
    menuObj.removeFromParent();
    VideoMenu.videoRef[menu] = 0;
  }

  hoverRightEnterQuery(world).forEach(function (eid) {
    console.log("hover enter");
    const menu = videoMenuQuery(world)[0];
    VideoMenu.videoRef[menu] = eid;
    const menuObj = world.eid2obj.get(menu)!;
    const videoObj = world.eid2obj.get(eid)!;
    videoObj.add(menuObj);
    menuObj.matrixWorldNeedsUpdate = true; // TODO: Fix in threejs
  });

  videoMenuQuery(world).forEach(function (eid) {
    const videoEid = VideoMenu.videoRef[eid];
    if (!videoEid) return;
    const video = (world.eid2obj.get(videoEid) as any).material.map.image as HTMLVideoElement;

    if (clicked(VideoMenu.playButtonRef[eid])) {
      console.log("clicked!");
      takeOwnership(world, videoEid);
      video.paused ? video.play() : video.pause();
    }

    const videoIsFacingCamera = isFacingCamera(world.eid2obj.get(videoEid)!);
    const menuObj = world.eid2obj.get(eid)!;
    const yRot = videoIsFacingCamera ? 0 : Math.PI;
    if (menuObj.rotation.y !== yRot) {
      menuObj.rotation.y = yRot;
      menuObj.matrixNeedsUpdate = true;
    }
  });
}
