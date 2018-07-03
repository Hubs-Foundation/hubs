
THREE.VignetteShader = {

	uniforms: {

		"tDiffuse": { value: null },
		"radius": { value: 0.65 },
    "opacity": { value: 0.9 },
    "softness": { value: 0.2 },
    "resolution": new THREE.Uniform(new THREE.Vector2(1920, 1080))

	},

	vertexShader: [
		"varying vec2 vUv;",
		"void main() {",
			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
		"}"

	].join( "\n" ),

	fragmentShader: [
		"uniform sampler2D tDiffuse;",
    "uniform float radius;",
    "uniform float opacity;",
    "uniform float softness;",
    "uniform vec2 resolution;",

		"varying vec2 vUv;",

		"void main() {",
			"vec4 texel = texture2D( tDiffuse, vUv);",
			"vec2 uvLeft = (vUv.xy) - vec2(0.25, 0.5);",
			"vec2 uvRight = (vUv.xy) - vec2(0.75, 0.5);",
			"float ratio = resolution.x / resolution.y;",
      "uvLeft.x *= ratio;",
			"uvRight.x *= ratio;",
      "float lenLeft = length(uvLeft);",
			"float lenRight = length(uvRight);",
      "float vignetteLeft = smoothstep(radius, radius-softness, lenLeft);",
			"float vignetteRight = smoothstep(radius, radius-softness, lenRight);",
			"vec3 final = mix (texel.rgb, texel.rgb * vignetteLeft, opacity);",
			"final += mix(texel.rgb, texel.rgb * vignetteRight, opacity);",
      "gl_FragColor = vec4(final.rgb, 1.0);",
		"}"

	].join( "\n" )

};
