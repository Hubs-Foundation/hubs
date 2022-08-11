import { MEDIA_TYPE } from "../utils/media-type";
import { Cube } from "../prefabs/cube";
import { sleep } from "../utils/async-utils";
import { easeOutQuadratic } from "../utils/easing";
import { loadImage } from "../utils/load-image";
import { loadVideo } from "../utils/load-video";
import { loadModel } from "../utils/load-model";
import { optionsFor } from "../utils/media-utils";
import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, removeEntity } from "bitecs";
import { MediaLoader, Networked } from "../bit-components";
import { createCoroutine, runCoroutine, chain } from "../utils/coroutine";
import { takeOwnership } from "../systems/netcode";
import { renderAsEntity } from "../utils/jsx-entity";
import { LoadingObject } from "../prefabs/loading-object";
// import { errorTexture } from "../utils/error-texture";
// import { Image } from "../prefabs/image";

const loaderForMediaType = {
  [MEDIA_TYPE.IMAGE]: loadImage,
  [MEDIA_TYPE.VIDEO]: loadVideo,
  [MEDIA_TYPE.MODEL]: loadModel
};

export const MEDIA_LOADER_FLAGS = {
  RECENTER: 1 << 0,
  RESIZE: 1 << 1
};

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
      if (NAF.clientId === Networked.owner[mediaLoaderEid]) takeOwnership(world, eid);
      i += 1;
    }
  });
}

function* animate({ properties, duration, easing, fn }) {
  const values = properties.map(([s]) => new THREE.Vector3().copy(s));
  const start = performance.now();
  const end = start + duration;
  let now = start;
  while (now < end) {
    const t = easing((now - start) / (end - start));
    for (let i = 0; i < values.length; i++) {
      values[i].lerpVectors(properties[i][0], properties[i][1], t);
    }
    fn(values);
    yield Promise.resolve();
    now = performance.now();
  }

  for (let i = 0; i < values.length; i++) {
    values[i].copy(properties[i][1]);
  }
  fn(values);
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

  yield animate({
    properties: [
      [startPosition, endPosition],
      [startScale, endScale]
    ],
    duration: 400,
    easing: easeOutQuadratic,
    fn: onAnimate
  });
}

const coroutines = new Map();

function removeLoadingCube(world, eid) {
  if (coroutines.get(eid).proxy.done) {
    removeEntity(world, world.eid2obj.get(eid).children[0].eid);
  } else {
    coroutines.get(eid).proxy.canceled = true;
  }
}

function add(world, child, parent) {
  const parentObj = world.eid2obj.get(parent);
  const childObj = world.eid2obj.get(child);
  parentObj.add(childObj);

  // TODO: Fix this in THREE.Object3D.add
  childObj.matrixNeedsUpdate = true;
}

function* maybeAddProxy(world, eid) {
  yield sleep(200);
  add(world, renderAsEntity(world, LoadingObject()), eid);
}

function* loadMedia(world, eid) {
  const src = APP.getString(MediaLoader.src[eid]);
  try {
    const options = yield optionsFor(src);
    const media = yield loaderForMediaType[options.mediaType]({ world, ...options });
    assignNetworkIds(world, media, eid);
    resizeAndRecenter(world, media, eid);
    removeLoadingCube(world, eid);
    add(world, media, eid);
    return media;
  } catch (e) {
    removeLoadingCube(world, eid);
    add(world, renderAsEntity(world, Cube()), eid);
    throw e;
  }
}

const mediaLoaderQuery = defineQuery([MediaLoader]);
const mediaLoaderEnterQuery = enterQuery(mediaLoaderQuery);
const mediaLoaderExitQuery = exitQuery(mediaLoaderQuery);
export function mediaLoadingSystem(world) {
  mediaLoaderEnterQuery(world).forEach(function (eid) {
    coroutines.set(eid, {
      load: createCoroutine(chain([() => loadMedia(world, eid), media => animateScale(world, media)])),
      proxy: createCoroutine(maybeAddProxy(world, eid))
    });
  });

  mediaLoaderExitQuery(world).forEach(function (eid) {
    if (coroutines.has(eid) && !entityExists(world, eid)) {
      coroutines.get(eid).load.canceled = true;
      coroutines.get(eid).proxy.canceled = true;
    }
  });

  coroutines.forEach(({ proxy, load }, eid) => {
    if (!proxy.done) {
      runCoroutine(proxy);
    }
    if (!load.done) {
      runCoroutine(load);
    }
    if (proxy.done && load.done) {
      coroutines.delete(eid);
    }
  });
}
