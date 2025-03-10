import { createVideoOrAudioEl } from "../utils/media-utils";
import audioIcon from "../assets/images/audio.png";
import { HubsVideoTexture } from "../textures/HubsVideoTexture";

// TODO: Replace async with function*?
export async function loadAudioTexture(
  src: string,
  loop: boolean,
  autoplay: boolean
): Promise<{ texture: HubsVideoTexture; ratio: number; video: HTMLVideoElement }> {
  const videoEl = createVideoOrAudioEl("video") as HTMLVideoElement;
  const imageEl = new Image();
  imageEl.src = audioIcon;
  imageEl.crossOrigin = "anonymous";
  const texture = new HubsVideoTexture(videoEl, imageEl);
  imageEl.onload = () => {
    texture.needsUpdate = true;
  };

  const isReady = () => {
    return (
      videoEl.readyState > 0 &&
      (texture.image.videoHeight || texture.image.height) &&
      (texture.image.videoWidth || texture.image.width)
    );
  };

  return new Promise((resolve, reject) => {
    let pollTimeout: ReturnType<typeof setTimeout>;
    const failLoad = function (e: Event) {
      videoEl.onerror = null;
      clearTimeout(pollTimeout);
      reject(e);
    };

    videoEl.src = src;
    videoEl.onerror = failLoad;
    videoEl.loop = loop;
    videoEl.autoplay = autoplay;

    // NOTE: We used to use the canplay event here to yield the texture, but that fails to fire on iOS Safari
    // and also sometimes in Chrome it seems.
    // TODO: Check if this is still true
    const poll = () => {
      if (isReady()) {
        videoEl.onerror = null;
        const height = texture.image.videoHeight || texture.image.height;
        const width = texture.image.videoWidth || texture.image.width;
        resolve({ texture, ratio: height / width, video: videoEl });
      } else {
        pollTimeout = setTimeout(poll, 500);
      }
    };

    poll();
  });
}
