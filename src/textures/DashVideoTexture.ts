import {
  Mapping,
  TextureDataType,
  TextureFilter,
  PixelFormat,
  VideoTexture,
  Wrapping
} from "three";

interface MediaPlayer {
  reset: () => {};
};

// DashVideoTexture class holds dash MediaPlayer
// and disposes it when texture is disposed.
// Note: Assumes that player is not shared among
//       other textures. If we want to allow shared
//       player we may need refcount.

export class DashVideoTexture extends VideoTexture {
  isDashVideoTexture: boolean;
  player: MediaPlayer | null;

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
    this.isDashVideoTexture = true;
    this.player = null; // Set by user later
  }

  dispose() {
    super.dispose();
    if (this.player !== null) {
      this.player.reset();
      this.player = null;
    }
  }
}
