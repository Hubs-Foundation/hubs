// for testing purposes
import rough from "../assets/textures/rough.png";
var ShinyShader = {
	 uniforms: {
    texture0: { value: THREE.ImageUtils.loadTexture( rough ) },
    time: { value: 1.0 },
    resolution: { value: new THREE.Vector2() }
  },

	vertexShader: `
	  varying vec3 vUv;
    void main(){
      vec4 modelViewPosition = modelViewMatrix * vec4(position, 1.0);
      gl_Position = projectionMatrix * modelViewPosition; 

      vUv = position;
    }
  `,

  fragmentShader: `
	  varying vec3 vUv;
    uniform vec2 resolution;
    uniform float time;
    uniform sampler2D texture0;
    void main() {
      vec3 col;
      vec2 p = vUv.xz; // in [-1,1] ?
      if (length(p) < 0.5) {
        vec2 k = gl_FragCoord.xy / resolution.xy;
        col = vec3(cos(50.*k.x), cos(50.*k.y), k.x*k.y);
      } else {
        col = texture2D(texture0, 0.5 + 0.5*p).xyz;
        col.r = sin(0.01*time);
      }
      gl_FragColor = vec4(col, 1.0);
    }
  `
};

export { ShinyShader }