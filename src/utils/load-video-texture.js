import { LinearFilter, VideoTexture, sRGBEncoding } from "three";
import { DashVideoTexture } from "../textures/DashVideoTexture";
import { createDashPlayer, createVideoOrAudioEl } from "./media-utils";

export async function loadVideoTexture(src, contentType) {
  const videoEl = createVideoOrAudioEl("video");
  let texture;

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

    if (contentType.startsWith("application/dash")) {
      texture = new DashVideoTexture(videoEl);
      texture.player = createDashPlayer(src, videoEl, failLoad);
    } else {
      texture = new VideoTexture(videoEl);
      videoEl.src = src;
      videoEl.onerror = failLoad;
    }

    texture.minFilter = LinearFilter;
    texture.encoding = sRGBEncoding;

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
