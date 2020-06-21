var GammaCorrectionShader = (gamma) => ({

	uniforms: {

		"tDiffuse": { value: null },
		"gammaFactor": { value: gamma }
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
		"uniform float gammaFactor;",

		"varying vec2 vUv;",

		"void main() {",

			"vec4 tex = texture2D( tDiffuse, vec2( vUv.x, vUv.y ) );",

			"gl_FragColor = LinearToGamma( tex, float( gammaFactor ) );",

		"}"

	].join( "\n" )

});

export { GammaCorrectionShader }
