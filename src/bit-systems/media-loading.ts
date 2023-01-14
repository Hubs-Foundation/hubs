import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { Vector3 } from "three";
import { HubsWorld } from "../app";
import { GLTFModel, MediaLoader, Networked, ObjectMenuTarget } from "../bit-components";
import { ErrorObject } from "../prefabs/error-object";
import { LoadingObject } from "../prefabs/loading-object";
import { animate } from "../utils/animate";
import { setNetworkedDataWithoutRoot } from "../utils/assign-network-ids";
import { cancelable, coroutine, crClearTimeout, crTimeout, makeCancelable } from "../utils/coroutine";
import { easeOutQuadratic } from "../utils/easing";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadImage } from "../utils/load-image";
import { loadModel } from "../utils/load-model";
import { loadVideo } from "../utils/load-video";
import { loadPDF } from "../utils/load-pdf";
import { MediaType, mediaTypeName, resolveMediaInfo } from "../utils/media-utils";
import { EntityID } from "../utils/networking-types";

const loaderForMediaType = {
  [MediaType.IMAGE]: (
    world: HubsWorld,
    { accessibleUrl, contentType }: { accessibleUrl: string; contentType: string }
  ) => loadImage(world, accessibleUrl, contentType),
  [MediaType.VIDEO]: (world: HubsWorld, { accessibleUrl }: { accessibleUrl: string }) =>
    loadVideo(world, accessibleUrl),
  [MediaType.MODEL]: (
    world: HubsWorld,
    { accessibleUrl, contentType }: { accessibleUrl: string; contentType: string }
  ) => loadModel(world, accessibleUrl, contentType, true),
  [MediaType.PDF]: (world: HubsWorld, { accessibleUrl }: { accessibleUrl: string }) => loadPDF(world, accessibleUrl)
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

  let scale = 1;
  if (resize) {
    const size = new THREE.Vector3();
    box.getSize(size);
    const multiplier = hasComponent(world, GLTFModel, media) ? 0.5 : 1.0;
    scale = multiplier / Math.max(size.x, size.y, size.z);
    mediaObj.scale.setScalar(scale);
    mediaObj.matrixNeedsUpdate = true;
  }

  if (recenter) {
    const center = new THREE.Vector3();
    box.getCenter(center);
    mediaObj.position.copy(center).multiplyScalar(-1 * scale);
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

  const startScale = new Vector3().setScalar(0.0001);
  const endScale = new Vector3().setScalar(mediaObj.scale.x);

  const startPosition = new Vector3().copy(mediaObj.position).multiplyScalar(startScale.x);
  const endPosition = new Vector3().copy(mediaObj.position);

  // Set the initial position and yield one frame
  // because the first frame that we render a new object is slow
  // TODO: We could move uploading textures to the GPU to the loader,
  //       so that we don't hitch here
  onAnimate([startPosition, startScale]);
  yield Promise.resolve();

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
  yield makeCancelable(() => loadingObjEid && removeEntity(world, loadingObjEid));
  const src = APP.getString(MediaLoader.src[eid]);
  let media;
  try {
    const urlData = (yield resolveMediaInfo(src)) as MediaInfo;
    const loader = urlData.mediaType && loaderForMediaType[urlData.mediaType];
    if (!loader) {
      throw new UnsupportedMediaTypeError(eid, urlData.mediaType);
    }
    media = yield* loader(world, urlData);
  } catch (e) {
    console.error(e);
    media = renderAsEntity(world, ErrorObject());
  }
  crClearTimeout(addLoadingObjectTimeout);
  loadingObjEid && removeEntity(world, loadingObjEid);
  return media;
}

function* loadAndAnimateMedia(world: HubsWorld, eid: EntityID, signal: AbortSignal) {
  const { value: media, canceled } = yield* cancelable(loadMedia(world, eid), signal);
  if (!canceled) {
    resizeAndRecenter(world, media, eid);
    if (MediaLoader.flags[eid] & MEDIA_LOADER_FLAGS.IS_OBJECT_MENU_TARGET) {
      addComponent(world, ObjectMenuTarget, eid);
    }
    add(world, media, eid);
    setNetworkedDataWithoutRoot(world, APP.getString(Networked.id[eid])!, media);
    if (MediaLoader.flags[eid] & MEDIA_LOADER_FLAGS.ANIMATE_LOAD) {
      yield* animateScale(world, media);
    }
    removeComponent(world, MediaLoader, eid);
  }
}

const jobs = new Set();
const abortControllers = new Map();
const mediaLoaderQuery = defineQuery([MediaLoader]);
const mediaLoaderEnterQuery = enterQuery(mediaLoaderQuery);
const mediaLoaderExitQuery = exitQuery(mediaLoaderQuery);
export function mediaLoadingSystem(world: HubsWorld) {
  mediaLoaderEnterQuery(world).forEach(function (eid) {
    const ac = new AbortController();
    abortControllers.set(eid, ac);
    jobs.add(coroutine(loadAndAnimateMedia(world, eid, ac.signal)));
  });

  mediaLoaderExitQuery(world).forEach(function (eid) {
    const ac = abortControllers.get(eid);
    ac.abort();
    abortControllers.delete(eid);
  });

  jobs.forEach((c: any) => {
    if (c().done) {
      jobs.delete(c);
    }
  });
}
