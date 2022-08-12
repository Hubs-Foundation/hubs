/** @jsx createElementEntity */
import { createElementEntity } from "../utils/jsx-entity";
import { renderAsEntity } from "../utils/jsx-entity";

import { createVideoOrAudioEl } from "../utils/media-utils";

async function loadVideoTexture({ src }) {
  const videoEl = createVideoOrAudioEl("video");
  const texture = new THREE.VideoTexture(videoEl);
  texture.minFilter = THREE.LinearFilter;
  texture.encoding = THREE.sRGBEncoding;

  // Firefox seems to have video play (or decode) performance issue.
  // Somehow setting RGBA format improves the performance very well.
  // Some tickets have been opened for the performance issue but
  // I don't think it will be fixed soon. So we set RGBA format for Firefox
  // as workaround so far.
  // See https://github.com/mozilla/hubs/issues/3470
  //
  // TODO: Is this still true?
  if (/firefox/i.test(navigator.userAgent)) {
    texture.format = THREE.RGBAFormat;
  }

  const isReady = () => {
    return (texture.image.videoHeight || texture.image.height) && (texture.image.videoWidth || texture.image.width);
  };

  return new Promise((resolve, reject) => {
    let pollTimeout;
    const failLoad = function (e) {
      videoEl.onerror = null;
      clearTimeout(pollTimeout);
      reject(e);
    };

    videoEl.src = src;
    videoEl.onerror = failLoad;

    // NOTE: We used to use the canplay event here to yield the texture, but that fails to fire on iOS Safari
    // and also sometimes in Chrome it seems.
    // TODO: Check if this is still true
    const poll = () => {
      if (isReady()) {
        videoEl.onerror = null;

        const height = texture.image.videoHeight || texture.image.height;
        const width = texture.image.videoWidth || texture.image.width;
        resolve({ texture, audioSourceEl: texture.image, ratio: height / width });
      } else {
        pollTimeout = setTimeout(poll, 500);
      }
    };

    poll();
  });
}

export function* loadVideo({ world, accessibleUrl, canonicalAudioUrl, contentType }) {
  console.log(`Url is ${accessibleUrl}`);
  const { texture, ratio } = yield loadVideoTexture({ src: accessibleUrl });

  return renderAsEntity(
    world,
    <entity
      video={{
        texture,
        textureSrc: accessibleUrl,
        textureVersion: 1,
        ratio,
        autoPlay: true,
        projection: "flat" /* TODO */
      }}
    />
  );
}
