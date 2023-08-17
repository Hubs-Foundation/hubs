import { LinearFilter, sRGBEncoding } from "three";
import HLS from "hls.js";
import { DashVideoTexture } from "../textures/DashVideoTexture";
import { HLSVideoTexture } from "../textures/HLSVideoTexture";
import { createDashPlayer, createHLSPlayer, createVideoOrAudioEl } from "./media-utils";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";

export async function loadVideoTexture(src, contentType, loop, autoplay) {
  const videoEl = createVideoOrAudioEl("video");
  let texture = null;

  const isReady = () => {
    // HLS audio only special path. TODO: Revisit later for properer handling.
    if (texture.isHLSVideoTexture === true) {
      if (texture.player.streamController.audioOnly === true) {
        texture.image.videoWidth = 1;
        texture.image.videoHeight = 1;
        return true;
      }
    }

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
      // TODO: Remove the dependency with AFRAME
    } else if (AFRAME.utils.material.isHLS(src, contentType)) {
      texture = new HLSVideoTexture(videoEl);
      if (HLS.isSupported()) {
        texture.player = createHLSPlayer(src, videoEl, failLoad);
      } else if (!videoEl.canPlayType(contentType)) {
        failLoad("HLS unsupported");
      }
    }

    if (texture === null) {
      texture = new HubsVideoTexture(videoEl);
      videoEl.src = src;
      videoEl.onerror = failLoad;
      videoEl.loop = loop;
      videoEl.autoplay = autoplay;
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
        resolve({ texture, audioSourceEl: texture.image, ratio: height / width, video: videoEl });
      } else {
        pollTimeout = setTimeout(poll, 500);
      }
    };

    poll();
  });
}
