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
  Deletable,
  LoadedByMediaLoader,
  MediaContentBounds,
  MediaImageLoaderData,
  MediaInfo,
  MediaLink,
  MediaLoaded,
  MediaLoader,
  MediaLoading,
  MediaVideoLoaderData,
  Networked,
  ObjectMenuTarget
} from "../bit-components";
import { inflatePhysicsShape, Shape } from "../inflators/physics-shape";
import { ErrorObject } from "../prefabs/error-object";
import { LoadingObject } from "../prefabs/loading-object";
import { animate } from "../utils/animate";
import { setNetworkedDataWithoutRoot } from "../utils/assign-network-ids";
import { crNextFrame } from "../utils/coroutine";
import { ClearFunction, JobRunner, withRollback } from "../utils/coroutine-utils";
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
import { findAncestorWithComponents, findAncestorsWithComponent } from "../utils/bit-utils";
import { setMatrixWorld } from "../utils/three-utils";
import { Type, inflateRigidBody } from "../inflators/rigid-body";
import { COLLISION_LAYERS } from "../constants";

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

const origMat = new Matrix4();
const invMat = new Matrix4();
const tmpMat = new Matrix4();
const diff = new Vector3();
const rootPosition = new Vector3();
const transformPosition = new Vector3();
const rootRotation = new Quaternion();
const rootScale = new Vector3();
function resizeAndRecenter(world: HubsWorld, mediaLoaderEid: EntityID, box: Box3) {
  const resize = MediaLoader.flags[mediaLoaderEid] & MEDIA_LOADER_FLAGS.RESIZE;
  const recenter = MediaLoader.flags[mediaLoaderEid] & MEDIA_LOADER_FLAGS.RECENTER;

  if (resize || recenter) {
    const mediaLoaderObj = world.eid2obj.get(mediaLoaderEid)!;
    const mediaObj = mediaLoaderObj.children.at(0)!;

    mediaLoaderObj.updateMatrixWorld();
    origMat.copy(mediaLoaderObj.matrixWorld);
    tmpMat.copy(origMat);
    invMat.copy(tmpMat).invert();
    tmpMat.multiply(invMat);
    setMatrixWorld(mediaLoaderObj, tmpMat);
    mediaLoaderObj.updateMatrixWorld();
    tmpMat.decompose(rootPosition, rootRotation, rootScale);

    box.setFromObject(mediaObj);

    // The AABB can be empty here for interactables that fetch media (ie. gltf with an empty that has a video component).
    // If we don't return the interactable would be wrongly positioned at the (0,0,0).
    if (box.isEmpty()) return;

    let scalar = 1;
    if (resize) {
      const size = new Vector3();
      box.getSize(size);
      scalar = 1 / Math.max(size.x, size.y, size.z);
    }

    if (recenter) {
      const center = new Vector3();
      center.addVectors(box.min, box.max).multiplyScalar(0.5);
      diff.subVectors(rootPosition, center);
      diff.multiplyScalar(scalar);
      transformPosition.addVectors(rootPosition, diff);
    }

    rootScale.set(scalar, scalar, scalar);
    tmpMat.compose(transformPosition, rootRotation, rootScale);
    setMatrixWorld(mediaObj, tmpMat);
    setMatrixWorld(mediaLoaderObj, origMat);
  }
}

function* animateScale(world: HubsWorld, mediaLoaderEid: EntityID) {
  if (MediaLoader.flags[mediaLoaderEid] & MEDIA_LOADER_FLAGS.ANIMATE_LOAD) {
    const mediaLoaderRootObj = world.eid2obj.get(mediaLoaderEid)!;
    const onAnimate = ([scale]: [Vector3]) => {
      mediaLoaderRootObj.scale.copy(scale);
      mediaLoaderRootObj.matrixNeedsUpdate = true;
    };
    const scalar = 0.001;
    const startScale = new Vector3().copy(mediaLoaderRootObj.scale).multiplyScalar(scalar);
    const endScale = new Vector3().copy(mediaLoaderRootObj.scale);
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
  if (entityExists(world, mediaLoaderEid)) {
    inflatePhysicsShape(world, mediaLoaderEid, {
      type: Shape.HULL,
      minHalfExtent: 0.04
    });
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

  // Media loaders that require resize/rotate need and intermediate object to apply the transform to
  // otherwise we will be updating the transform of the media.
  const resize = MediaLoader.flags[mediaLoaderEid] & MEDIA_LOADER_FLAGS.RESIZE;
  const recenter = MediaLoader.flags[mediaLoaderEid] & MEDIA_LOADER_FLAGS.RECENTER;
  if (resize || recenter) {
    const mediaTransformEid = addEntity(world);
    const mediaTransformObj = new Group();
    mediaTransformObj.name = "Media Loader Transform";
    addObject3DComponent(world, mediaTransformEid, mediaTransformObj);
    add(world, mediaTransformEid, mediaLoaderEid);
    add(world, mediaEid, mediaTransformEid);
  } else {
    add(world, mediaEid, mediaLoaderEid);
  }

  setNetworkedDataWithoutRoot(world, APP.getString(Networked.id[mediaLoaderEid])!, mediaEid);

  addComponent(world, MediaContentBounds, mediaLoaderEid);
  const mediaObj = world.eid2obj.get(mediaEid)!;
  box.setFromObject(mediaObj);
  box.getSize(tmpVector);
  MediaContentBounds.bounds[mediaLoaderEid].set(tmpVector.toArray());

  removeComponent(world, MediaLoading, mediaLoaderEid);
  removeComponent(world, MediaLink, mediaLoaderEid);
}

const loadingCubes = new Map();
const jobs = new JobRunner();
const mediaLoadingQuery = defineQuery([MediaLoading]);
const mediaLoadingEnterQuery = enterQuery(mediaLoadingQuery);
const mediaLoadingExitQuery = exitQuery(mediaLoadingQuery);
const mediaLoadedQuery = defineQuery([MediaLoaded]);
const mediaLoadedEnterQuery = enterQuery(mediaLoadedQuery);
const mediaLoadedExitQuery = exitQuery(mediaLoadedQuery);
export function mediaLoadingSystem(world: HubsWorld) {
  mediaLoadingEnterQuery(world).forEach(function (eid) {
    const mediaLoaderEids = findAncestorsWithComponent(world, MediaLoader, eid);
    mediaLoaderEids.forEach(mediaLoaderEid => {
      MediaLoader.count[mediaLoaderEid]++;
    });

    if (MediaLoader.flags[eid] & MEDIA_LOADER_FLAGS.ANIMATE_LOAD) {
      const loadingObjEid = renderAsEntity(world, LoadingObject());
      add(world, loadingObjEid, eid);
      loadingCubes.set(eid, loadingObjEid);
    }

    // If it's not deletable media, we need to add a rigid body to correctly position the physics shape
    const deletableEid = findAncestorWithComponents(world, [MediaLoader, Deletable], eid);
    if (!deletableEid) {
      inflateRigidBody(world, eid, {
        type: Type.STATIC,
        collisionGroup: COLLISION_LAYERS.INTERACTABLES,
        collisionMask: COLLISION_LAYERS.INTERACTABLES
      });
    }

    jobs.add(eid, clearRollbacks => loadAndAnimateMedia(world, eid, clearRollbacks));
  });

  mediaLoadingExitQuery(world).forEach(function (eid) {
    jobs.stop(eid);

    if (MediaImageLoaderData.has(eid)) {
      MediaImageLoaderData.delete(eid);
    }

    if (MediaVideoLoaderData.has(eid)) {
      MediaVideoLoaderData.delete(eid);
    }

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
        mediaObj.visible = true;

        resizeAndRecenter(world, mediaLoaderEid, box);

        // We only animate/scale and add physics to the root media loader in the hierarchy to
        // avoid creating unnecessary nested physics shapes.
        if (i === mediaLoaderEids.length - 1) {
          jobs.add(mediaLoaderEid, () => animateScale(world, mediaLoaderEid));
        }
      }
    }
  });

  mediaLoadedEnterQuery(world).forEach(() => APP.scene?.emit("listed_media_changed"));
  mediaLoadedExitQuery(world).forEach(() => APP.scene?.emit("listed_media_changed"));

  jobs.tick();
}
