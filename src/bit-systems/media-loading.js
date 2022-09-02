import { LoadingObject } from "../prefabs/loading-object";
import { ErrorObject } from "../prefabs/error-object";
import { easeOutQuadratic } from "../utils/easing";
import { loadImage } from "../utils/load-image";
import { loadVideo } from "../utils/load-video";
import { loadModel } from "../utils/load-model";
import { MediaType, resolveMediaInfo } from "../utils/media-utils";
import { defineQuery, enterQuery, exitQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { MediaLoader, Networked } from "../bit-components";
import { crTimeout, crClearTimeout, cancelable, coroutine, makeCancelable } from "../utils/coroutine";
import { takeOwnership } from "../systems/netcode";
import { renderAsEntity } from "../utils/jsx-entity";
import { animate } from "../utils/animate";

const loaderForMediaType = {
  [MediaType.IMAGE]: (world, { accessibleUrl, contentType }) => loadImage(world, accessibleUrl, contentType),
  [MediaType.VIDEO]: (world, { accessibleUrl }) => loadVideo(world, accessibleUrl),
  [MediaType.MODEL]: (world, { accessibleUrl }) => loadModel(world, accessibleUrl)
};

export const MEDIA_LOADER_FLAGS = {
  RECENTER: 1 << 0,
  RESIZE: 1 << 1
};

function assignNetworkIds(world, mediaEid, mediaLoaderEid) {
  const rootNid = APP.getString(Networked.id[mediaLoaderEid]);
  let i = 0;
  world.eid2obj.get(mediaEid).traverse(function (obj) {
    if (obj.eid && hasComponent(world, Networked, obj.eid)) {
      const eid = obj.eid;
      Networked.id[eid] = APP.getSid(`${rootNid}.${i}`);
      APP.world.nid2eid.set(Networked.id[eid], eid);
      Networked.creator[eid] = Networked.creator[mediaLoaderEid];
      Networked.owner[eid] = Networked.owner[mediaLoaderEid];
      if (APP.getSid(NAF.clientId) === Networked.owner[mediaLoaderEid]) takeOwnership(world, eid);
      i += 1;
    }
  });
}

function resizeAndRecenter(world, media, eid) {
  const resize = MediaLoader.flags[eid] & MEDIA_LOADER_FLAGS.RESIZE;
  const recenter = MediaLoader.flags[eid] & MEDIA_LOADER_FLAGS.RECENTER;
  if (!resize && !recenter) return;

  const mediaObj = world.eid2obj.get(media);
  const box = new THREE.Box3();
  box.setFromObject(mediaObj);

  let scale = 1;
  if (resize) {
    const size = new THREE.Vector3();
    box.getSize(size);
    // Might want to consider avatar scale someday
    scale = 0.5 / Math.max(size.x, size.y, size.z);
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

function* animateScale(world, media) {
  const mediaObj = world.eid2obj.get(media);

  const onAnimate = ([position, scale]) => {
    mediaObj.position.copy(position);
    mediaObj.scale.copy(scale);
    mediaObj.matrixNeedsUpdate = true;
  };

  const startScale = new THREE.Vector3().setScalar(0.0001);
  const endScale = new THREE.Vector3().setScalar(mediaObj.scale.x);

  const startPosition = new THREE.Vector3().copy(mediaObj.position).multiplyScalar(startScale.x);
  const endPosition = new THREE.Vector3().copy(mediaObj.position);

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

function add(world, child, parent) {
  const parentObj = world.eid2obj.get(parent);
  const childObj = world.eid2obj.get(child);
  parentObj.add(childObj);

  // TODO: Fix this in THREE.Object3D.add
  childObj.matrixWorldNeedsUpdate = true;
}

function* loadMedia(world, eid) {
  let loadingObjEid = 0;
  const addLoadingObjectTimeout = crTimeout(() => {
    loadingObjEid = renderAsEntity(world, LoadingObject());
    add(world, loadingObjEid, eid);
  }, 400);
  yield makeCancelable(() => loadingObjEid && removeEntity(world, loadingObjEid));
  const src = APP.getString(MediaLoader.src[eid]);
  let media;
  try {
    const urlData = yield resolveMediaInfo(src);
    media = yield* loaderForMediaType[urlData.mediaType](world, urlData);
  } catch (e) {
    console.error(e);
    media = renderAsEntity(world, ErrorObject());
  }
  crClearTimeout(addLoadingObjectTimeout);
  loadingObjEid && removeEntity(world, loadingObjEid);
  return media;
}

function* loadAndAnimateMedia(world, eid, signal) {
  const { value: media, canceled } = yield* cancelable(loadMedia(world, eid), signal);
  if (!canceled) {
    assignNetworkIds(world, media, eid);
    resizeAndRecenter(world, media, eid);
    add(world, media, eid);
    yield* animateScale(world, media);
    removeComponent(world, MediaLoader, eid);
  }
}

const jobs = new Set();
const abortControllers = new Map();
const mediaLoaderQuery = defineQuery([MediaLoader]);
const mediaLoaderEnterQuery = enterQuery(mediaLoaderQuery);
const mediaLoaderExitQuery = exitQuery(mediaLoaderQuery);
export function mediaLoadingSystem(world) {
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

  jobs.forEach(c => {
    if (c().done) {
      jobs.delete(c);
    }
  });
}
