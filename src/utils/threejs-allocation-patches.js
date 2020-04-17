export default function patchThreeAllocations() {
  const renderer = AFRAME.scenes[0].renderer;
  const gl = renderer.getContext();

  // These functions in three.js uses the arguments object, which allocates.
  renderer.state.texImage2D = function(a, b, c, d, e, f, g, h, i) {
    try {
      if (g === undefined) {
        gl.texImage2D(a, b, c, d, e, f);
      } else {
        gl.texImage2D(a, b, c, d, e, f, g, h, i);
      }
    } catch (error) {
      console.error("THREE.WebGLState:", error);
    }
  };

  renderer.state.compressedTexImage2D = function(a, b, c, d, e, f, g, h, i, j) {
    try {
      if (h === undefined) {
        gl.compressedTexImage2D(a, b, c, d, e, f, g);
      } else if (i === undefined) {
        gl.compressedTexImage2D(a, b, c, d, e, f, g, h);
      } else if (j === undefined) {
        gl.compressedTexImage2D(a, b, c, d, e, f, g, h, i);
      } else {
        gl.compressedTexImage2D(a, b, c, d, e, f, g, h, i, j);
      }
    } catch (error) {
      console.error("THREE.WebGLState:", error);
    }
  };
}
