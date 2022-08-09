const { detect } = require("detect-browser");
const browser = detect();

const isFirefox = browser.name === "firefox";

const supportsCaptureStreamTrack = typeof window.CanvasCaptureMediaStreamTrack !== "undefined";

function blitFramebuffer(renderer, src, srcX0, srcY0, srcX1, srcY1, dest, dstX0, dstY0, dstX1, dstY1) {
  const gl = renderer.getContext();

  // Copies from one framebuffer to another. Note that at the end of this function, you need to restore
  // the original framebuffer via setRenderTarget
  const srcFramebuffer = renderer.properties.get(src).__webglFramebuffer;
  const destFramebuffer = renderer.properties.get(dest).__webglFramebuffer;

  if (srcFramebuffer && destFramebuffer) {
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, srcFramebuffer);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, destFramebuffer);

    if (gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
      gl.blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, gl.COLOR_BUFFER_BIT, gl.LINEAR);
    }
  }
}
const createBlankAudioTrack = () => {
  const context = THREE.AudioContext.getContext();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  const destination = context.createMediaStreamDestination();
  gain.gain.setValueAtTime(0.0001, context.currentTime);
  oscillator.connect(destination);
  gain.connect(destination);
  return destination.stream.getAudioTracks()[0];
};

export class RenderTargetRecorder {
  constructor(renderer, mimeType, captureWidth, captureHeight, fps, srcAudioTrack) {
    this.renderer = renderer;

    // Create a separate render target for video because we need to flip (and sometimes downscale) it before
    // encoding it to video.
    this.videoRenderTarget = new THREE.WebGLRenderTarget(captureWidth, captureHeight, {
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.NearestFilter,
      encoding: THREE.sRGBEncoding,
      depth: false,
      stencil: false
    });

    const tmpRenderTarget = renderer.getRenderTarget();
    // Used to set up framebuffer in three.js as a side effect
    renderer.setRenderTarget(this.videoRenderTarget);
    renderer.setRenderTarget(tmpRenderTarget);

    const videoCanvas = document.createElement("canvas");
    videoCanvas.width = this.videoRenderTarget.width;
    videoCanvas.height = this.videoRenderTarget.height;

    this.videoContext = videoCanvas.getContext("2d");
    this.videoImageData = this.videoContext.createImageData(
      this.videoRenderTarget.width,
      this.videoRenderTarget.height
    );
    // this.videoPixels = new Uint8Array(captureWidth * captureHeight * 4);
    // this.videoImageData.data.set(this.videoPixels);

    const stream = videoCanvas.captureStream(supportsCaptureStreamTrack ? 0 : fps);
    this.videoTrack = stream.getVideoTracks()[0];

    if (srcAudioTrack) {
      stream.addTrack(srcAudioTrack);
    } else if (isFirefox) {
      // FF 73+ seems to fail to decode videos with no audio track, so we always include a silent track.
      // Chrome has issues when the audio tracks are silent so we only do this for FF.
      // https://bugs.chromium.org/p/chromium/issues/detail?id=1223382
      stream.addTrack(createBlankAudioTrack());
    }

    this.mediaRecorder = new MediaRecorder(stream, { mimeType });
  }

  start() {
    this.chunks = [];
    this.mediaRecorder.ondataavailable = e => this.chunks.push(e.data);
    this.mediaRecorder.start();
  }

  captureFrame(srcRenderTarget) {
    blitFramebuffer(
      this.renderer,
      srcRenderTarget,
      0,
      0,
      srcRenderTarget.width,
      srcRenderTarget.height,
      this.videoRenderTarget,
      0,
      this.videoRenderTarget.height,
      this.videoRenderTarget.width,
      0
    );
    this.renderer.readRenderTargetPixels(
      this.videoRenderTarget,
      0,
      0,
      this.videoRenderTarget.width,
      this.videoRenderTarget.height,
      this.videoImageData.data
    );
    // this.videoImageData.data.set(this.videoPixels);
    this.videoContext.putImageData(this.videoImageData, 0, 0);
    if (supportsCaptureStreamTrack) {
      this.videoTrack.requestFrame();
    }
  }

  save() {
    return new Promise(resolve => {
      this.mediaRecorder.onstop = () => {
        const chunks = this.chunks;
        if (chunks.length === 0) resolve(null);
        const mimeType = chunks[0].type;
        const blob = new Blob(chunks, { type: mimeType });
        const file = new File([blob], "capture", { type: mimeType.split(";")[0] }); // Drop codec
        chunks.length = 0;
        resolve(file);
      };
      this.mediaRecorder.stop();
    });
  }

  cancel() {
    this.mediaRecorder.ondataavailable = null;
    this.mediaRecorder.stop();
    this.chunks.length = 0;
  }
}

export async function pixelsToPNG(pixels, width, height) {
  const snapCanvas = document.createElement("canvas");
  snapCanvas.width = width;
  snapCanvas.height = height;
  const context = snapCanvas.getContext("2d");

  const imageData = context.createImageData(width, height);
  imageData.data.set(pixels);
  const bitmap = await createImageBitmap(imageData);
  context.scale(1, -1);
  context.drawImage(bitmap, 0, -height);
  const blob = await new Promise(resolve => snapCanvas.toBlob(resolve));
  return new File([blob], "snap.png", { type: "image/png" });
}
