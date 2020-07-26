var AdjustColorShader = (brightness, contrast, saturation) => ({
	uniforms: {	
		"tDiffuse": { value: null },
		"brightness": {
			value: brightness
		},
		"contrast": {
			value: contrast
		},
		"saturation": {
			value: saturation
		},
	},

	vertexShader: [

		"varying vec2 vUv;",

		"void main() {",

			"vUv = uv;",
			"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",

		"}"

	].join( "\n" ),

	fragmentShader: `
		mat4 brightnessMatrix( float brightness )
		{
		    return mat4( 1, 0, 0, 0,
		                 0, 1, 0, 0,
		                 0, 0, 1, 0,
		                 brightness, brightness, brightness, 1 );
		}

		mat4 contrastMatrix( float contrast )
		{
			float t = ( 1.0 - contrast ) / 2.0;
		    
		    return mat4( contrast, 0, 0, 0,
		                 0, contrast, 0, 0,
		                 0, 0, contrast, 0,
		                 t, t, t, 1 );

		}

		mat4 saturationMatrix( float saturation )
		{
		    vec3 luminance = vec3( 0.3086, 0.6094, 0.0820 );
		    
		    float oneMinusSat = 1.0 - saturation;
		    
		    vec3 red = vec3( luminance.x * oneMinusSat );
		    red+= vec3( saturation, 0, 0 );
		    
		    vec3 green = vec3( luminance.y * oneMinusSat );
		    green += vec3( 0, saturation, 0 );
		    
		    vec3 blue = vec3( luminance.z * oneMinusSat );
		    blue += vec3( 0, 0, saturation );
		    
		    return mat4( red,     0,
		                 green,   0,
		                 blue,    0,
		                 0, 0, 0, 1 );
		}

		uniform float brightness;
		uniform float contrast;
		uniform float saturation;
		uniform sampler2D tDiffuse;

		varying vec2 vUv;

		void main()
		{
		    vec4 tex = texture2D( tDiffuse, vec2( vUv.x, vUv.y ) );

			gl_FragColor = brightnessMatrix( brightness ) *
		        		   contrastMatrix( contrast ) * 
		        		   saturationMatrix( saturation ) *
		        		   tex;
		}
	`
});

export { AdjustColorShader }
