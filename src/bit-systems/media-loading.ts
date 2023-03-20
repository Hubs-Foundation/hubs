import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { Vector3 } from "three";
import { HubsWorld } from "../app";
import { GLTFModel, MediaLoaded, MediaLoader, Networked, ObjectMenuTarget } from "../bit-components";
import { inflatePhysicsShape, Shape } from "../inflators/physics-shape";
import { ErrorObject } from "../prefabs/error-object";
import { LoadingObject } from "../prefabs/loading-object";
import { animate } from "../utils/animate";
import { setNetworkedDataWithoutRoot } from "../utils/assign-network-ids";
import { crClearTimeout, crNextFrame, crTimeout } from "../utils/coroutine";
import { ClearFunction, JobRunner, withRollback } from "../utils/coroutine-utils";
import { easeOutQuadratic } from "../utils/easing";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadImage } from "../utils/load-image";
import { loadModel } from "../utils/load-model";
import { loadPDF } from "../utils/load-pdf";
import { loadVideo } from "../utils/load-video";
import { loadAudio } from "../utils/load-audio";
import { MediaType, mediaTypeName, resolveMediaInfo } from "../utils/media-utils";
import { EntityID } from "../utils/networking-types";

export function* waitForMediaLoaded(world: HubsWorld, eid: EntityID) {
  while (hasComponent(world, MediaLoader, eid)) {
    yield crNextFrame();
  }
}

const loaderForMediaType = {
  [MediaType.IMAGE]: (
    world: HubsWorld,
    { accessibleUrl, contentType }: { accessibleUrl: string; contentType: string }
  ) => loadImage(world, accessibleUrl, contentType),
  [MediaType.VIDEO]: (
    world: HubsWorld,
    { accessibleUrl, contentType }: { accessibleUrl: string; contentType: string }
  ) => loadVideo(world, accessibleUrl, contentType),
  [MediaType.MODEL]: (
    world: HubsWorld,
    { accessibleUrl, contentType }: { accessibleUrl: string; contentType: string }
  ) => loadModel(world, accessibleUrl, contentType, true),
  [MediaType.PDF]: (world: HubsWorld, { accessibleUrl }: { accessibleUrl: string }) => loadPDF(world, accessibleUrl),
  [MediaType.AUDIO]: (world: HubsWorld, { accessibleUrl }: { accessibleUrl: string }) => loadAudio(world, accessibleUrl)
};

export const MEDIA_LOADER_FLAGS = {
  RECENTER: 1 << 0,
  RESIZE: 1 << 1,
  ANIMATE_LOAD: 1 << 2,
  IS_OBJECT_MENU_TARGET: 1 << 3
};

function resizeAndRecenter(world: HubsWorld, media: EntityID, eid: EntityID) {
  const resize = MediaLoader.flags[eid] & MEDIA_LOADER_FLAGS.RESIZE;
  const recenter = MediaLoader.flags[eid] & MEDIA_LOADER_FLAGS.RECENTER;
  if (!resize && !recenter) return;

  const mediaObj = world.eid2obj.get(media)!;
  const box = new THREE.Box3();
  box.setFromObject(mediaObj);

  let scalar = 1;
  if (resize) {
    const size = new THREE.Vector3();
    box.getSize(size);
    scalar = 1 / Math.max(size.x, size.y, size.z);
    if (hasComponent(world, GLTFModel, media)) scalar = scalar * 0.5;
    mediaObj.scale.multiplyScalar(scalar);
    mediaObj.matrixNeedsUpdate = true;
  }

  if (recenter) {
    const center = new THREE.Vector3();
    box.getCenter(center);
    mediaObj.position.copy(center).multiplyScalar(-1 * scalar);
    mediaObj.matrixNeedsUpdate = true;
  }
}

export function* animateScale(world: HubsWorld, media: EntityID) {
  const mediaObj = world.eid2obj.get(media)!;
  const onAnimate = ([position, scale]: [Vector3, Vector3]) => {
    mediaObj.position.copy(position);
    mediaObj.scale.copy(scale);
    mediaObj.matrixNeedsUpdate = true;
  };
  const scalar = 0.001;
  const startScale = new Vector3().copy(mediaObj.scale).multiplyScalar(scalar);
  const endScale = new Vector3().copy(mediaObj.scale);
  // The animation should affect the mediaObj as if its parent were being scaled:
  // If mediaObj is offset from its parent (e.g. because it was recentered),
  // then its position relative to its parent also needs to be scaled.
  const startPosition = new Vector3().copy(mediaObj.position).multiplyScalar(scalar);
  const endPosition = new Vector3().copy(mediaObj.position);
  // Animate once to set the initial state, then yield one frame
  // because the first render of the new object may be slow
  // TODO: We could move uploading textures to the GPU to the loader,
  //       so that we don't hitch here
  onAnimate([startPosition, startScale]);
  yield crNextFrame();
  yield* animate({
    properties: [
      [startPosition, endPosition],
      [startScale, endScale]
    ],
    durationMS: 400,
    easing: easeOutQuadratic,
    fn: onAnimate
  });
}

// TODO: Move to bit utils and rename
export function add(world: HubsWorld, child: EntityID, parent: EntityID) {
  const parentObj = world.eid2obj.get(parent)!;
  const childObj = world.eid2obj.get(child)!;
  parentObj.add(childObj);
}

class UnsupportedMediaTypeError extends Error {
  constructor(eid: EntityID, mediaType: number | null) {
    super();
    this.name = "UnsupportedMediaTypeError";
    this.message = `Cannot load media for entity ${eid}. No loader for media type ${mediaType} (${mediaTypeName(
      mediaType
    )}).`;
  }
}

type MediaInfo = {
  accessibleUrl: string;
  canonicalUrl: string;
  canonicalAudioUrl: string | null;
  contentType: string;
  mediaType: number | null; // TODO: Use MediaType
  thumbnail: string;
};

function* loadMedia(world: HubsWorld, eid: EntityID) {
  let loadingObjEid = 0;
  const addLoadingObjectTimeout = crTimeout(() => {
    loadingObjEid = renderAsEntity(world, LoadingObject());
    add(world, loadingObjEid, eid);
  }, 400);
  yield withRollback(Promise.resolve(), () => loadingObjEid && removeEntity(world, loadingObjEid));
  const src = APP.getString(MediaLoader.src[eid]);
  let media: EntityID;
  try {
    const urlData = (yield resolveMediaInfo(src)) as MediaInfo;
    const loader = urlData.mediaType && loaderForMediaType[urlData.mediaType];
    if (!loader) {
      throw new UnsupportedMediaTypeError(eid, urlData.mediaType);
    }
    media = yield* loader(world, urlData);
    addComponent(world, MediaLoaded, media);
  } catch (e) {
    console.error(e);
    media = renderAsEntity(world, ErrorObject());
  }
  crClearTimeout(addLoadingObjectTimeout);
  loadingObjEid && removeEntity(world, loadingObjEid);
  return media;
}

function* loadAndAnimateMedia(world: HubsWorld, eid: EntityID, clearRollbacks: ClearFunction) {
  if (MediaLoader.flags[eid] & MEDIA_LOADER_FLAGS.IS_OBJECT_MENU_TARGET) {
    addComponent(world, ObjectMenuTarget, eid);
  }
  const media = yield* loadMedia(world, eid);
  clearRollbacks(); // After this point, normal entity cleanup will takes care of things

  resizeAndRecenter(world, media, eid);
  add(world, media, eid);
  setNetworkedDataWithoutRoot(world, APP.getString(Networked.id[eid])!, media);
  if (MediaLoader.flags[eid] & MEDIA_LOADER_FLAGS.ANIMATE_LOAD) {
    yield* animateScale(world, media);
  }
  removeComponent(world, MediaLoader, eid);

  if (media) {
    // TODO update scale?
    inflatePhysicsShape(world, media, {
      type: hasComponent(world, GLTFModel, media) ? Shape.HULL : Shape.BOX,
      minHalfExtent: 0.04
    });
  }
}

const jobs = new JobRunner();
const mediaLoaderQuery = defineQuery([MediaLoader]);
const mediaLoaderEnterQuery = enterQuery(mediaLoaderQuery);
const mediaLoaderExitQuery = exitQuery(mediaLoaderQuery);
export function mediaLoadingSystem(world: HubsWorld) {
  mediaLoaderEnterQuery(world).forEach(function (eid) {
    jobs.add(eid, clearRollbacks => loadAndAnimateMedia(world, eid, clearRollbacks));
  });

  mediaLoaderExitQuery(world).forEach(function (eid) {
    jobs.stop(eid);
  });

  jobs.tick();
}
