import {
  addComponent,
  addEntity,
  defineQuery,
  enterQuery,
  entityExists,
  exitQuery,
  hasComponent,
  removeComponent,
  removeEntity
} from "bitecs";
import { Box3, Group, Matrix4, Quaternion, Vector3 } from "three";
import { HubsWorld } from "../app";
import {
  GLTFModel,
  HoverableVisuals,
  LoadedByMediaLoader,
  MediaContentBounds,
  MediaImageLoaderData,
  MediaInfo,
  MediaLink,
  MediaLoaded,
  MediaLoader,
  MediaRefresh,
  MediaLoading,
  MediaVideoLoaderData,
  MirroredMedia,
  Networked,
  ObjectMenuTarget,
  Rigidbody,
  MediaLoaderOffset,
  MediaVideo,
  NetworkedTransform
} from "../bit-components";
import { inflatePhysicsShape, Shape } from "../inflators/physics-shape";
import { ErrorObject } from "../prefabs/error-object";
import { LoadingObject } from "../prefabs/loading-object";
import { animate } from "../utils/animate";
import { setNetworkedDataWithoutRoot } from "../utils/assign-network-ids";
import { crNextFrame } from "../utils/coroutine";
import { ClearFunction, JobRunner } from "../utils/coroutine-utils";
import { easeOutQuadratic } from "../utils/easing";
import { addObject3DComponent, renderAsEntity } from "../utils/jsx-entity";
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
import { findAncestorsWithComponent, findChildWithComponent } from "../utils/bit-utils";
import { setMatrixWorld } from "../utils/three-utils";
import { computeObjectAABB, getScaleCoefficient } from "../utils/auto-box-collider";
import { updateHoverableVisuals } from "./hoverable-visuals-system";
import { VIDEO_FLAGS } from "../inflators/video";

export function* waitForMediaLoaded(world: HubsWorld, eid: EntityID) {
  while (hasComponent(world, MediaLoader, eid)) {
    yield crNextFrame();
  }
}

export const MEDIA_LOADER_FLAGS = {
  RECENTER: 1 << 0,
  RESIZE: 1 << 1,
  ANIMATE_LOAD: 1 << 2,
  IS_OBJECT_MENU_TARGET: 1 << 3,
  MOVE_PARENT_NOT_OBJECT: 1 << 4
};

const origMat = new Matrix4();
const tmpMat = new Matrix4();
const diff = new Vector3();
const rootPosition = new Vector3();
const transformPosition = new Vector3();
const rootRotation = new Quaternion();
const rootScale = new Vector3();
function resizeAndRecenter(world: HubsWorld, mediaLoaderEid: EntityID, box: Box3) {
  const resize = MediaLoader.flags[mediaLoaderEid] & MEDIA_LOADER_FLAGS.RESIZE;
  const recenter = MediaLoader.flags[mediaLoaderEid] & MEDIA_LOADER_FLAGS.RECENTER;
  const moveParentNotObject = MediaLoader.flags[mediaLoaderEid] & MEDIA_LOADER_FLAGS.MOVE_PARENT_NOT_OBJECT;

  const mediaLoaderObj = world.eid2obj.get(mediaLoaderEid)!;
  const offsetEid = findChildWithComponent(world, MediaLoaderOffset, mediaLoaderEid)!;
  const offsetObj = world.eid2obj.get(offsetEid)!;

  let scalar = 1;
  if (recenter) {
    mediaLoaderObj.updateMatrices();
    origMat.copy(mediaLoaderObj.matrixWorld);
    tmpMat.copy(origMat);
    // Reset rotation to correctly calculate AABB
    tmpMat.decompose(rootPosition, rootRotation, rootScale);
    tmpMat.compose(rootPosition, rootRotation.identity(), new Vector3(1, 1, 1));
    setMatrixWorld(mediaLoaderObj, tmpMat);

    computeObjectAABB(mediaLoaderObj, box, true);
    if (box.isEmpty()) return;

    if (resize) {
      const mediaEid = findChildWithComponent(world, LoadedByMediaLoader, mediaLoaderEid)!;
      scalar = getScaleCoefficient(hasComponent(world, GLTFModel, mediaEid) ? 0.5 : 1, box);
      rootScale.set(scalar, scalar, scalar);
    }

    // Calculate translate vector to move the AABB center of the object to the media loader center
    const center = new Vector3();
    center.addVectors(box.min, box.max).multiplyScalar(0.5);
    diff.subVectors(rootPosition, center);
    diff.multiplyScalar(scalar);
    transformPosition.addVectors(rootPosition, diff);

    // Set the new offset world matrix and restore the media loader original matrix
    tmpMat.compose(transformPosition, rootRotation.identity(), rootScale);
    setMatrixWorld(offsetObj, tmpMat);
    setMatrixWorld(mediaLoaderObj, origMat);
  } else if (moveParentNotObject) {
    mediaLoaderObj.updateMatrices();
    origMat.copy(mediaLoaderObj.matrixWorld);
    tmpMat.copy(origMat);
    tmpMat.decompose(rootPosition, rootRotation, rootScale);
    tmpMat.compose(rootPosition, rootRotation.identity(), new Vector3(1, 1, 1));
    setMatrixWorld(mediaLoaderObj, tmpMat);

    origMat.decompose(rootPosition, rootRotation, rootScale);

    computeObjectAABB(mediaLoaderObj, box, true);
    if (box.isEmpty()) return;

    const center = new Vector3();
    center.addVectors(box.min, box.max).multiplyScalar(0.5);
    diff.subVectors(rootPosition, center);
    transformPosition.subVectors(rootPosition, diff);

    tmpMat.compose(transformPosition, rootRotation, rootScale);
    setMatrixWorld(mediaLoaderObj, tmpMat);
    setMatrixWorld(offsetObj, origMat);
  }

  addComponent(world, MediaContentBounds, mediaLoaderEid);
  box.getSize(tmpVector);
  tmpVector.multiplyScalar(scalar);
  MediaContentBounds.bounds[mediaLoaderEid].set(tmpVector.toArray());
}

export function* animateScale(world: HubsWorld, mediaLoaderEid: EntityID) {
  const mediaLoaderObj = world.eid2obj.get(mediaLoaderEid)!;
  const transformObj = mediaLoaderObj.children.at(0)!;
  const onAnimate = ([scale]: [Vector3]) => {
    transformObj.scale.copy(scale);
    transformObj.matrixNeedsUpdate = true;
  };
  const scalar = 0.001;
  const startScale = new Vector3().copy(transformObj.scale).multiplyScalar(scalar);
  const endScale = new Vector3().copy(transformObj.scale);
  // Animate once to set the initial state, then yield one frame
  // because the first render of the new object may be slow
  // TODO: We could move uploading textures to the GPU to the loader,
  //       so that we don't hitch here
  onAnimate([startScale]);
  yield crNextFrame();
  yield* animate({
    properties: [[startScale, endScale]],
    durationMS: 400,
    easing: easeOutQuadratic,
    fn: onAnimate
  });
}

function* finish(world: HubsWorld, mediaLoaderEid: EntityID) {
  if (entityExists(world, mediaLoaderEid) && MediaLoader.flags[mediaLoaderEid] & MEDIA_LOADER_FLAGS.ANIMATE_LOAD) {
    yield* animateScale(world, mediaLoaderEid);
  }
  if (entityExists(world, mediaLoaderEid)) {
    if (hasComponent(world, HoverableVisuals, mediaLoaderEid)) {
      updateHoverableVisuals(world, mediaLoaderEid);
    }
    if (hasComponent(world, Rigidbody, mediaLoaderEid)) {
      inflatePhysicsShape(world, mediaLoaderEid, {
        type: Shape.HULL,
        minHalfExtent: 0.04
      });
    }
  }
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
  const isLinked = hasComponent(world, MirroredMedia, eid);
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
        MediaVideoLoaderData.has(eid) ? MediaVideoLoaderData.get(eid)! : {},
        !isLinked
      );
      break;
    case MediaType.MODEL:
      mediaEid = yield* loadModel(world, accessibleUrl, contentType, true);
      break;
    case MediaType.PDF:
      return yield* loadPDF(world, eid, accessibleUrl, !isLinked);
    case MediaType.AUDIO:
      mediaEid = yield* loadAudio(
        world,
        eid,
        accessibleUrl,
        MediaVideoLoaderData.has(eid) ? MediaVideoLoaderData.get(eid)! : {},
        !isLinked
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
  const src = APP.getString(MediaLoader.src[eid]);
  let media: EntityID;
  try {
    const urlData = (yield resolveMediaInfo(src)) as MediaInfo;
    media = yield* loadByMediaType(world, eid, urlData);
    addComponent(world, MediaLoaded, media);
    addComponent(world, MediaInfo, media);
    MediaInfo.accessibleUrl[media] = APP.getSid(urlData.accessibleUrl);
    MediaInfo.contentType[media] = APP.getSid(urlData.contentType);
    MediaInfo.mediaType[media] = urlData.mediaType || 0;
  } catch (e) {
    console.error(e);
    media = renderAsEntity(world, ErrorObject());
  }
  addComponent(world, LoadedByMediaLoader, media);
  MediaLoader.mediaRef[eid] = media;
  const mediaObj = world.eid2obj.get(media)!;
  mediaObj.visible = false;
  return media;
}

const tmpVector = new Vector3();
const box = new Box3();
function* loadAndAnimateMedia(world: HubsWorld, mediaLoaderEid: EntityID, clearRollbacks: ClearFunction) {
  if (MediaLoader.flags[mediaLoaderEid] & MEDIA_LOADER_FLAGS.IS_OBJECT_MENU_TARGET) {
    addComponent(world, ObjectMenuTarget, mediaLoaderEid);
  }

  const mediaEid = yield* loadMedia(world, mediaLoaderEid);
  clearRollbacks(); // After this point, normal entity cleanup will takes care of things

  const mediaTransformEid = addEntity(world);
  const mediaTransformObj = new Group();
  mediaTransformObj.name = "Media Loader Offset";
  addObject3DComponent(world, mediaTransformEid, mediaTransformObj);
  addComponent(world, MediaLoaderOffset, mediaTransformEid);
  add(world, mediaTransformEid, mediaLoaderEid);
  add(world, mediaEid, mediaTransformEid);

  setNetworkedDataWithoutRoot(world, APP.getString(Networked.id[mediaLoaderEid])!, mediaEid);

  removeComponent(world, MediaLoading, mediaLoaderEid);
  removeComponent(world, MediaLink, mediaLoaderEid);
}

function* refreshMedia(world: HubsWorld, eid: EntityID, clearRollbacks: ClearFunction) {
  removeComponent(world, MediaRefresh, eid);
  const offsetEid = findChildWithComponent(world, MediaLoaderOffset, eid)!;
  removeEntity(world, offsetEid);
  addComponent(world, MediaLoading, eid);
}

const loadingCubes = new Map();
const jobs = new JobRunner();
const mediaLoadingQuery = defineQuery([MediaLoading]);
const mediaLoadingEnterQuery = enterQuery(mediaLoadingQuery);
const mediaLoadingExitQuery = exitQuery(mediaLoadingQuery);
const mediaLoadedQuery = defineQuery([MediaLoaded]);
const mediaLoadedEnterQuery = enterQuery(mediaLoadedQuery);
const mediaLoadedExitQuery = exitQuery(mediaLoadedQuery);
const mediaRefreshQuery = defineQuery([MediaRefresh]);
const mediaRefreshEnterQuery = enterQuery(mediaRefreshQuery);
export function mediaLoadingSystem(world: HubsWorld) {
  mediaLoadingEnterQuery(world).forEach(function (eid) {
    const mediaLoaderObj = world.eid2obj.get(eid)!;
    mediaLoaderObj.visible = false;

    const mediaLoaderEids = findAncestorsWithComponent(world, MediaLoader, eid);
    mediaLoaderEids.forEach(mediaLoaderEid => {
      MediaLoader.count[mediaLoaderEid]++;
    });

    if (MediaLoader.flags[eid] & MEDIA_LOADER_FLAGS.ANIMATE_LOAD) {
      const loadingObjEid = renderAsEntity(world, LoadingObject());
      add(world, loadingObjEid, eid);
      loadingCubes.set(eid, loadingObjEid);
    }

    jobs.add(eid, clearRollbacks => loadAndAnimateMedia(world, eid, clearRollbacks));
  });

  mediaLoadingExitQuery(world).forEach(function (eid: EntityID) {
    jobs.stop(eid);

    if (MediaImageLoaderData.has(eid)) {
      MediaImageLoaderData.delete(eid);
    }

    if (MediaVideoLoaderData.has(eid)) {
      MediaVideoLoaderData.delete(eid);
    }

    const mediaLoaderObj = world.eid2obj.get(eid)!;
    mediaLoaderObj.visible = true;

    const mediaLoaderEids = findAncestorsWithComponent(world, MediaLoader, eid);
    for (let i = 0; i < mediaLoaderEids.length; i++) {
      const mediaLoaderEid = mediaLoaderEids[i];
      MediaLoader.count[mediaLoaderEid]--;
      // Hide loading cube and resize/recenter when the media loader has finished
      // loading all it's nested entities.
      if (MediaLoader.count[mediaLoaderEid] === 0) {
        if (MediaLoader.flags[mediaLoaderEid] & MEDIA_LOADER_FLAGS.ANIMATE_LOAD) {
          const loadingCubeEid = loadingCubes.get(mediaLoaderEid);
          const loadingCube = world.eid2obj.get(loadingCubeEid);
          loadingCube?.removeFromParent();
          removeEntity(world, loadingCubeEid);
        }

        const mediaEid = MediaLoader.mediaRef[mediaLoaderEid];
        const mediaObj = world.eid2obj.get(mediaEid)!;
        if (MediaInfo.mediaType[mediaEid] === MediaType.AUDIO) {
          mediaObj.visible = Boolean(MediaVideo.flags[mediaEid] & VIDEO_FLAGS.CONTROLS);
        } else {
          mediaObj.visible = true;
        }

        resizeAndRecenter(world, mediaLoaderEid, box);

        // We only animate/scale and add physics to the root media loader in the hierarchy to
        // avoid creating unnecessary nested physics shapes.
        if (i === mediaLoaderEids.length - 1) {
          jobs.add(mediaLoaderEid, () => finish(world, mediaLoaderEid));
        }
      }
    }
  });

  mediaLoadingQuery(world).forEach((eid: EntityID) => {
    const mediaLoaderObj = world.eid2obj.get(eid)!;
    transformPosition.fromArray(NetworkedTransform.position[eid]);
    if (mediaLoaderObj.position.near(transformPosition, 0.001)) {
      mediaLoaderObj.visible = true;
    }
  });

  mediaLoadedEnterQuery(world).forEach(() => APP.scene?.emit("listed_media_changed"));
  mediaLoadedExitQuery(world).forEach(() => APP.scene?.emit("listed_media_changed"));

  mediaRefreshEnterQuery(world).forEach((eid: EntityID) => {
    if (!jobs.has(eid)) {
      jobs.add(eid, clearRollbacks => refreshMedia(world, eid, clearRollbacks));
    }
  });

  jobs.tick();
}
