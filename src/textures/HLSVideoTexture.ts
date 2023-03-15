import { Mapping, TextureDataType, TextureFilter, PixelFormat, VideoTexture, Wrapping } from "three";

interface HLSPlayer {
  stopLoad: () => {};
  detachMedia: () => {};
  destroy: () => {};
}

// HLSVideoTexture class holds HLS Player
// and disposes it when texture is disposed.
// Note: Assumes that player is not shared among
//       other textures. If we want to allow shared
//       player we may need refcount.

export class HLSVideoTexture extends VideoTexture {
  isHLSVideoTexture: boolean;
  player: HLSPlayer | null;

  constructor(
    video: HTMLVideoElement,
    mapping?: Mapping,
    wrapS?: Wrapping,
    wrapT?: Wrapping,
    magFilter?: TextureFilter,
    minFilter?: TextureFilter,
    format?: PixelFormat,
    type?: TextureDataType,
    anisotropy?: number
  ) {
    super(video, mapping, wrapS, wrapT, magFilter, minFilter, format, type, anisotropy);
    this.isHLSVideoTexture = true;
    this.player = null; // Set by user later
  }

  dispose() {
    super.dispose();
    if (this.player !== null) {
      this.player.stopLoad();
      this.player.detachMedia();
      this.player.destroy();
      this.player = null;
    }
  }
}
