import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, removeComponent } from "bitecs";
import { HubsWorld } from "../app";
import { MediaPDF, MediaSnapped, MediaVideo, MediaVideoData } from "../bit-components";
import { SOUND_CAMERA_TOOL_TOOK_SNAPSHOT } from "../systems/sound-effects-system";
import { JobRunner } from "../utils/coroutine-utils";
import { EntityID } from "../utils/networking-types";
import { PDFResourcesMap } from "./pdf-system";
import { guessContentType } from "../utils/media-url-utils";
import { upload } from "../utils/media-utils";
import qsTruthy from "../utils/qs_truthy";
import { createNetworkedMedia } from "../utils/create-networked-entity";
import { Quaternion, Vector3 } from "three";
import { MediaLoaderParams } from "../inflators/media-loader";
import { animate } from "../utils/animate";
import { easeOutQuadratic } from "../utils/easing";
import { crNextFrame } from "../utils/coroutine";

const TYPE_IMG_PNG = { type: "image/png" };

const finalPos = new Vector3();
const intialPos = new Vector3();
const tmpQuat = new Quaternion();
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
      const desiredContentType = file.type || guessContentType(file.name);
      const uploadPromise = new Promise((resolve, reject) => {
        upload(file, desiredContentType)
          .then(function (response) {
            const srcUrl = new URL(response.origin);
            srcUrl.searchParams.set("token", response.meta.access_token);
            resolve({
              src: srcUrl.href,
              recenter: true,
              resize: !qsTruthy("noResize"),
              animateLoad: true,
              fileId: response.file_id,
              isObjectMenuTarget: true
            });
          })
          .catch(e => {
            console.error("Media upload failed", e);
            reject({
              src: "error",
              recenter: true,
              resize: !qsTruthy("noResize"),
              animateLoad: true,
              isObjectMenuTarget: true
            });
          });
      });

      const params: MediaLoaderParams = yield uploadPromise;
      const snappedEid = createNetworkedMedia(APP.world, params);
      const idx = (Math.floor(Math.random() * 100) % 6) + 3;
      finalPos.set(
        Math.cos(Math.PI * 2 * (idx / 6.0)) * 0.75,
        Math.sin(Math.PI * 2 * (idx / 6.0)) * 0.75,
        -0.05 + idx * 0.001
      );
      const sourceObj = world.eid2obj.get(eid)!;
      sourceObj.localToWorld(finalPos);
      const snappedObj = APP.world.eid2obj.get(snappedEid)!;
      sourceObj.getWorldQuaternion(tmpQuat);
      snappedObj.quaternion.copy(tmpQuat);

      const onAnimate = ([pos]: [Vector3]) => {
        snappedObj.position.copy(pos);
        snappedObj.matrixNeedsUpdate = true;
      };
      yield crNextFrame();
      sourceObj.getWorldPosition(intialPos);
      yield* animate({
        properties: [[intialPos, finalPos]],
        durationMS: 400,
        easing: easeOutQuadratic,
        fn: onAnimate
      });
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
