import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, removeComponent } from "bitecs";
import { HubsWorld } from "../app";
import { MediaPDF, MediaSnapped, MediaVideo, MediaVideoData } from "../bit-components";
import { SOUND_CAMERA_TOOL_TOOK_SNAPSHOT } from "../systems/sound-effects-system";
import { JobRunner } from "../utils/coroutine-utils";
import { EntityID } from "../utils/networking-types";
import { PDFResourcesMap } from "./pdf-system";
import { spawnFromFileList } from "../load-media-on-paste-or-drop";

const TYPE_IMG_PNG = { type: "image/png" };

export function* snapMedia(world: HubsWorld, eid: EntityID) {
  let canvas: HTMLCanvasElement | undefined;
  if (hasComponent(world, MediaPDF, eid)) {
    const res = PDFResourcesMap.get(eid);
    canvas = res?.canvas;
  } else if (hasComponent(world, MediaVideo, eid)) {
    const video = MediaVideoData.get(eid)!;
    if (video) {
      canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d")!.drawImage(video, 0, 0, canvas.width, canvas.height);
    }
  }

  if (canvas) {
    const blob = new Promise((resolve, reject) => {
      if (canvas) {
        canvas.toBlob(resolve);
      } else {
        reject();
      }
    });
    if (blob) {
      const file = new File([yield blob], "snap.png", TYPE_IMG_PNG);
      spawnFromFileList([file] as any);
    } else {
      console.error("Snapped image creation error");
    }
  }

  if (entityExists(world, eid)) {
    removeComponent(world, MediaSnapped, eid);
  }
}

const jobs = new JobRunner();
const snappedMediaQuery = defineQuery([MediaSnapped]);
const snappedEnterQuery = enterQuery(snappedMediaQuery);
const snappedExitQuery = exitQuery(snappedMediaQuery);
export function snapMediaSystem(world: HubsWorld, sfxSystem: any) {
  snappedExitQuery(world).forEach(eid => {
    jobs.stop(eid);
  });
  snappedEnterQuery(world).forEach(eid => {
    sfxSystem.playSoundOneShot(SOUND_CAMERA_TOOL_TOOK_SNAPSHOT);

    if (!jobs.has(eid)) {
      jobs.add(eid, () => snapMedia(world, eid));
    }
  });
  jobs.tick();
}
