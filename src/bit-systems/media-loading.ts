import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { Box3, Euler, Vector3 } from "three";
import { HubsWorld } from "../app";
import {
  GLTFModel,
  LoadedByMediaLoader,
  MediaContentBounds,
  MediaImageLoaderData,
  MediaInfo,
  MediaLink,
  MediaLoaded,
  MediaLoader,
  MediaVideoLoaderData,
  Networked,
  ObjectMenuTarget
} from "../bit-components";
import { inflatePhysicsShape, Shape } from "../inflators/physics-shape";
import { ErrorObject } from "../prefabs/error-object";
import { LoadingObject } from "../prefabs/loading-object";
import { animate } from "../utils/animate";
import { setNetworkedDataWithoutRoot } from "../utils/assign-network-ids";
import { computeObjectAABB } from "../utils/auto-box-collider";
import { crClearTimeout, crNextFrame, crTimeout } from "../utils/coroutine";
import { ClearFunction, JobRunner, withRollback } from "../utils/coroutine-utils";
import { easeOutQuadratic } from "../utils/easing";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadImage } from "../utils/load-image";
import { loadModel } from "../utils/load-model";
import { loadPDF } from "../utils/load-pdf";
import { loadVideo } from "../utils/load-video";
import { loadAudio } from "../utils/load-audio";
import { loadHtml } from "../utils/load-html";
import { MediaType, mediaTypeName, resolveMediaInfo } from "../utils/media-utils";
import { EntityID } from "../utils/networking-types";
import { LinkType, inflateLink } from "../inflators/link";
import { inflateGrabbable } from "../inflators/grabbable";

const getBox = (() => {
  const rotation = new Euler();
  return (world: HubsWorld, eid: EntityID, rootEid: EntityID, box: Box3, worldSpace?: boolean) => {
    const obj = world.eid2obj.get(eid)!;
    const rootObj = world.eid2obj.get(rootEid)!;

    rotation.copy(obj.rotation);
    obj.rotation.set(0, 0, 0);
    obj.updateMatrices(true, true);
    rootObj.updateMatrices(true, true);
    rootObj.updateMatrixWorld(true);

    computeObjectAABB(rootObj, box, false);

    if (!box.isEmpty()) {
      if (!worldSpace) {
        obj.worldToLocal(box.min);
        obj.worldToLocal(box.max);
      }
      obj.rotation.copy(rotation);
      obj.matrixNeedsUpdate = true;
    }

    rootObj.matrixWorldNeedsUpdate = true;
    rootObj.updateMatrices();
  };
})();

export function* waitForMediaLoaded(world: HubsWorld, eid: EntityID) {
  while (hasComponent(world, MediaLoader, eid)) {
    yield crNextFrame();
  }
}

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
  const box = new Box3();
  box.setFromObject(mediaObj);

  // The AABB can be empty here for interactables that fetch  media (ie. gltf with an empty that has a video component).
  // If we don't return the interactable would be wrongly positioned at the (0,0,0).
  if (box.isEmpty()) return;

  let scalar = 1;
  if (resize) {
    const size = new Vector3();
    box.getSize(size);
    scalar = 1 / Math.max(size.x, size.y, size.z);
    if (hasComponent(world, GLTFModel, media)) scalar = scalar * 0.5;
    mediaObj.scale.multiplyScalar(scalar);
    mediaObj.matrixNeedsUpdate = true;
  }

  if (recenter) {
    const center = new Vector3();
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

function* loadByMediaType(
  world: HubsWorld,
  eid: EntityID,
  { accessibleUrl, canonicalUrl, contentType, mediaType, thumbnail }: MediaInfo
) {
  // Note: For Image, Video, and Audio, additional parameters can be
  //       set via glTF image/video/audio inflators inflateImageLoader
  //       and inflateVideoLoader.
  // TODO: Refactor media loading flow to simplify.
  //       Only in loading glTF Image, Video, and Audio flows,
  //       specified parameters assignment is needed after loading
  //       content then using MediaImage/VideoLoaderData as like
  //       transporting data from the inflators. This may be like
  //       special and a bit less maintainable.
  let mediaEid;
  switch (mediaType) {
    case MediaType.IMAGE:
      mediaEid = yield* loadImage(
        world,
        eid,
        accessibleUrl,
        contentType,
        MediaImageLoaderData.has(eid) ? MediaImageLoaderData.get(eid)! : {}
      );
      break;
    case MediaType.VIDEO:
      mediaEid = yield* loadVideo(
        world,
        eid,
        accessibleUrl,
        contentType,
        MediaVideoLoaderData.has(eid) ? MediaVideoLoaderData.get(eid)! : {}
      );
      break;
    case MediaType.MODEL:
      mediaEid = yield* loadModel(world, accessibleUrl, contentType, true);
      break;
    case MediaType.PDF:
      return yield* loadPDF(world, eid, accessibleUrl);
    case MediaType.AUDIO:
      mediaEid = yield* loadAudio(
        world,
        eid,
        accessibleUrl,
        MediaVideoLoaderData.has(eid) ? MediaVideoLoaderData.get(eid)! : {}
      );
      break;
    case MediaType.HTML:
      return yield* loadHtml(world, eid, canonicalUrl, thumbnail);
    default:
      throw new UnsupportedMediaTypeError(eid, mediaType);
  }

  if (hasComponent(world, MediaLink, eid)) {
    inflateLink(world, mediaEid, { href: APP.getString(MediaLink.src[eid])!, type: LinkType.LINK });
    inflateGrabbable(world, mediaEid, { cursor: true, hand: false });
  }

  return mediaEid;
}

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
    media = yield* loadByMediaType(world, eid, urlData);
    addComponent(world, MediaLoaded, media);
    addComponent(world, MediaInfo, media);
    MediaInfo.accessibleUrl[media] = APP.getSid(urlData.accessibleUrl);
    MediaInfo.contentType[media] = APP.getSid(urlData.contentType);
  } catch (e) {
    console.error(e);
    media = renderAsEntity(world, ErrorObject());
  }
  addComponent(world, LoadedByMediaLoader, media);
  crClearTimeout(addLoadingObjectTimeout);
  loadingObjEid && removeEntity(world, loadingObjEid);
  return media;
}

const tmpVector = new Vector3();
const box = new Box3();
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
  removeComponent(world, MediaLink, eid);

  if (media) {
    if (hasComponent(world, MediaLoaded, media)) {
      getBox(world, eid, media, box);
      addComponent(world, MediaContentBounds, eid);
      box.getSize(tmpVector);
      MediaContentBounds.bounds[eid].set(tmpVector.toArray());
    }
    // TODO update scale?
    inflatePhysicsShape(world, eid, {
      type: hasComponent(world, GLTFModel, media) ? Shape.HULL : Shape.BOX,
      minHalfExtent: 0.04
    });
  }
}

const jobs = new JobRunner();
const mediaLoaderQuery = defineQuery([MediaLoader]);
const mediaLoaderEnterQuery = enterQuery(mediaLoaderQuery);
const mediaLoaderExitQuery = exitQuery(mediaLoaderQuery);
const mediaLoadedQuery = defineQuery([MediaLoaded]);
const mediaLoadedEnterQuery = enterQuery(mediaLoadedQuery);
const mediaLoadedExitQuery = exitQuery(mediaLoadedQuery);
export function mediaLoadingSystem(world: HubsWorld) {
  mediaLoaderEnterQuery(world).forEach(function (eid) {
    jobs.add(eid, clearRollbacks => loadAndAnimateMedia(world, eid, clearRollbacks));
  });

  mediaLoaderExitQuery(world).forEach(function (eid) {
    jobs.stop(eid);

    if (MediaImageLoaderData.has(eid)) {
      MediaImageLoaderData.delete(eid);
    }

    if (MediaVideoLoaderData.has(eid)) {
      MediaVideoLoaderData.delete(eid);
    }
  });

  mediaLoadedEnterQuery(world).forEach(() => APP.scene?.emit("listed_media_changed"));
  mediaLoadedExitQuery(world).forEach(() => APP.scene?.emit("listed_media_changed"));

  jobs.tick();
}
