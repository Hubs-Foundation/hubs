import { LinearFilter, Texture } from "three";
import { Mapping, TextureDataType, TextureFilter, PixelFormat, Wrapping } from "three";

export class HubsVideoTexture extends Texture {
  isVideoTexture: boolean;
  wasPaused: boolean;
  video: HTMLVideoElement;

  constructor(
    video: HTMLVideoElement,
    image?: HTMLImageElement,
    mapping?: Mapping,
    wrapS?: Wrapping,
    wrapT?: Wrapping,
    magFilter?: TextureFilter,
    minFilter?: TextureFilter,
    format?: PixelFormat,
    type?: TextureDataType,
    anisotropy?: number
  ) {
    super(image ? image : video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);

    this.video = video;
    if (!image) {
      this.isVideoTexture = true;

      this.minFilter = minFilter !== undefined ? minFilter : LinearFilter;
      this.magFilter = magFilter !== undefined ? magFilter : LinearFilter;

      this.generateMipmaps = false;

      const scope = this;

      function updateVideo() {
        scope.needsUpdate = true;
        video.requestVideoFrameCallback(updateVideo);
      }

      if ("requestVideoFrameCallback" in video) {
        video.requestVideoFrameCallback(updateVideo);
      }
    }
  }

  clone(): any {
    return new HubsVideoTexture(this.video, !this.isVideoTexture && this.image.data).copy(this);
  }

  update() {
    if (this.isVideoTexture) {
      const video = this.image;
      const paused = video.paused;
      const hasVideoFrameCallback = "requestVideoFrameCallback" in video;

      // Don't transfer textures from paused videos.
      if (paused && this.wasPaused) return;

      if (hasVideoFrameCallback === false && video.readyState >= video.HAVE_CURRENT_DATA) {
        if (paused) {
          this.wasPaused = true;
        } else if (this.wasPaused) {
          this.wasPaused = false;
        }

        this.needsUpdate = true;
      }
    }
  }
}
