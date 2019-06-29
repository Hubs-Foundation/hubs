export default function addBlitFrameBufferFunction() {
  const renderer = AFRAME.scenes[0].renderer;
  const gl = renderer.context;

  // Copies from one framebuffer to another. Note that at the end of this function, you need to restore
  // the original framebuffer via setRenderTarget
  renderer.blitFramebuffer = function(src, srcX0, srcY0, srcX1, srcY1, dest, dstX0, dstY0, dstX1, dstY1) {
    if (!(src && src.isWebGLRenderTarget)) {
      console.error("THREE.WebGLRenderer.readRenderTargetPixels: src is not THREE.WebGLRenderTarget.");
      return;
    }

    if (!(dest && dest.isWebGLRenderTarget)) {
      console.error("THREE.WebGLRenderer.readRenderTargetPixels: dest is not THREE.WebGLRenderTarget.");
      return;
    }

    const srcFramebuffer = this.properties.get(src).__webglFramebuffer;
    const destFramebuffer = this.properties.get(dest).__webglFramebuffer;

    if (srcFramebuffer && destFramebuffer) {
      gl.bindFramebuffer(gl.READ_FRAMEBUFFER, srcFramebuffer);
      gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, destFramebuffer);

      if (gl.checkFramebufferStatus(gl.READ_FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
        gl.blitFramebuffer(srcX0, srcY0, srcX1, srcY1, dstX0, dstY0, dstX1, dstY1, gl.COLOR_BUFFER_BIT, gl.LINEAR);
      } else {
        console.error("THREE.WebGLRenderer.blitFramebuffer: readPixels from src failed. Framebuffer not complete.");
      }
    }
  };
}
