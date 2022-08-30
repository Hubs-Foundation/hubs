import { createVideoOrAudioEl } from "../utils/media-utils";
export async function loadVideoTexture(src) {
  const videoEl = createVideoOrAudioEl("video");
  const texture = new THREE.VideoTexture(videoEl);
  texture.minFilter = THREE.LinearFilter;
  texture.encoding = THREE.sRGBEncoding;

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
