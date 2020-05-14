import { Color } from "three";

var CustomShader = {

	uniforms: {
		tDiffuse: { value: null },
	},

	vertexShader: `
    varying vec2 vUv;
    void main() {
     	vUv = uv;
     	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
    }
  `,

	fragmentShader: `
		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main() {
			vec4 texel = texture2D( tDiffuse, vUv );
			gl_FragColor = vec4(1.0-texel.r, 1.0-texel.g, 1.0-texel.b, 1.0);
		}
	`
};

export { CustomShader }