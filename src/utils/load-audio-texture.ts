import { VideoTexture } from "three";
import { createVideoOrAudioEl } from "../utils/media-utils";

// TODO: Replace async with function*?
// TODO: Integrate with loadVideoTexture in load-audio-texture?
export async function loadAudioTexture(src: string) : Promise<{texture: VideoTexture, ratio: number}> {
  const videoEl = createVideoOrAudioEl("video") as HTMLVideoElement;
  const texture = new VideoTexture(videoEl);

  const isReady = () => {
    return videoEl.readyState > 0;
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

    // NOTE: We used to use the canplay event here to yield the texture, but that fails to fire on iOS Safari
    // and also sometimes in Chrome it seems.
    // TODO: Check if this is still true
    const poll = () => {
      if (isReady()) {
        videoEl.onerror = null;
        // TODO: AudioIcon image must be used to render and
	//       ratio must be of the AudioIcon. Fix this.
	//       Also see the comment in utils/load-audio.
        resolve({ texture, ratio: 3.0 / 4.0 });
      } else {
        pollTimeout = setTimeout(poll, 500);
      }
    };

    poll();
  });
}
