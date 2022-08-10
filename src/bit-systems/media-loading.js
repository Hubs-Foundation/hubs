import { MEDIA_TYPE } from "../utils/media-type";
import { Cube } from "../prefabs/cube";
import { loadImage } from "../utils/load-image";
import { loadVideo } from "../utils/load-video";
import { loadModel } from "../utils/load-model";
import { optionsFor } from "../utils/media-utils";
import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent, removeEntity } from "bitecs";
import { MediaLoader, Networked } from "../bit-components";
import { createCoroutine, runCoroutine } from "../utils/coroutine";
import { takeOwnership } from "../systems/netcode";
import { renderAsEntity } from "../utils/jsx-entity";
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

function swapLoadingObject(world, media, eid) {
  removeEntity(world, MediaLoader.loadingObjectRef[eid]);
  world.eid2obj.get(eid).add(world.eid2obj.get(media));
  // TODO: Fix add in threejs
  world.eid2obj.get(media).matrixWorldNeedsUpdate = true;
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

function* loadMedia(world, eid) {
  const src = APP.getString(MediaLoader.src[eid]);
  console.log(`[Load ${eid}]: Load initiated for ${src}`);
  try {
    const options = yield optionsFor(src);
    const media = yield loaderForMediaType[options.mediaType]({ world, ...options });
    assignNetworkIds(world, media, eid);
    resizeAndRecenter(world, media, eid);
    swapLoadingObject(world, media, eid);
  } catch (e) {
    console.warn(e);
    console.warn("Could not load media for src: ", src);
    swapLoadingObject(world, renderAsEntity(world, Cube()), eid);
  }
}

const loading = new Map();
const mediaLoaderQuery = defineQuery([MediaLoader]);
const mediaLoaderEnterQuery = enterQuery(mediaLoaderQuery);
const mediaLoaderExitQuery = exitQuery(mediaLoaderQuery);
export function mediaLoadingSystem(world) {
  mediaLoaderEnterQuery(world).forEach(function (eid) {
    loading.set(eid, createCoroutine(loadMedia(world, eid)));
  });

  mediaLoaderExitQuery(world).forEach(function (eid) {
    if (loading.has(eid) && !entityExists(world, eid)) {
      loading.get(eid).canceled = true;
    }
  });

  loading.forEach((coroutine, eid) => {
    runCoroutine(coroutine);
    if (coroutine.done) {
      loading.delete(eid);
    }
  });
}
