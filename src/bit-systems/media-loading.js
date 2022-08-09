import { MEDIA_TYPE } from "../utils/media-type";
import { Cube } from "../prefabs/cube";
import { loadImage } from "../utils/load-image";
import { loadVideo } from "../utils/load-video";
import { loadModel } from "../utils/load-model";
import { optionsFor } from "../utils/media-utils";
import { defineQuery, enterQuery, entityExists, exitQuery, removeEntity } from "bitecs";
import { MediaLoader } from "../bit-components";
import { createCoroutine, runCoroutine } from "../utils/coroutine";
import { renderAsEntity } from "../utils/jsx-entity";
// import { errorTexture } from "../utils/error-texture";
// import { Image } from "../prefabs/image";

const loaderForMediaType = {
  [MEDIA_TYPE.IMAGE]: loadImage,
  [MEDIA_TYPE.VIDEO]: loadVideo,
  [MEDIA_TYPE.MODEL]: loadModel
};

function swapLoadingObject({ world, eid, media }) {
  removeEntity(world, MediaLoader.loadingObjectRef[eid]);
  world.eid2obj.get(eid).add(world.eid2obj.get(media));
}

function* loadMedia({ world, eid, src }) {
  try {
    console.log(`[Load ${eid}]: Load initiated for ${src}`);
    const options = yield optionsFor(src);
    const loader = loaderForMediaType[options.mediaType];
    const media = yield loader({ world, mediaLoaderEid: eid, ...options });

    swapLoadingObject({ world, eid, media });
  } catch (e) {
    console.warn(e);
    console.warn("Could not load media for src: ", src);
    swapLoadingObject({ world, eid, media: renderAsEntity(world, Cube()) });
  }
}

const loading = new Map();
const mediaLoaderQuery = defineQuery([MediaLoader]);
const mediaLoaderEnterQuery = enterQuery(mediaLoaderQuery);
const mediaLoaderExitQuery = exitQuery(mediaLoaderQuery);
export function mediaLoadingSystem(world) {
  mediaLoaderEnterQuery(world).forEach(function (eid) {
    loading.set(eid, createCoroutine(loadMedia({ world, eid, src: APP.getString(MediaLoader.src[eid]) })));
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
