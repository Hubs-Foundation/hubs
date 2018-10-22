THREE.VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    radius: { value: 0.65 },
    opacity: { value: 0.9 },
    softness: { value: 0.2 },
    resolution: new THREE.Uniform(new THREE.Vector2(1920, 1080))
  },

  vertexShader: [
    "varying vec2 vUv;",
    "void main() {",
    "vUv = uv;",
    "gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
    "}"
  ].join("\n"),

  fragmentShader: [
    "uniform sampler2D tDiffuse;",
    "uniform float radius;",
    "uniform float opacity;",
    "uniform float softness;",
    "uniform vec2 resolution;",

    "varying vec2 vUv;",

    "void main() {",
    "vec4 texel = texture2D( tDiffuse, vUv);",
    "float ratio = resolution.x / resolution.y;",
    "float centerXOffset = radius / ratio;",
    "float leftX = (0.3 + centerXOffset >= 0.5) ? 0.5 - centerXOffset : 0.3;",
    "float rightX = (0.7 - centerXOffset <= 0.5) ? 0.5 + centerXOffset : 0.7;",
    "vec2 uvLeft = (vUv.xy) - vec2(leftX, 0.5);",
    "vec2 uvRight = (vUv.xy) - vec2(rightX, 0.5);",
    "uvLeft.x *= ratio;",
    "uvRight.x *= ratio;",
    "float lenLeft = length(uvLeft);",
    "float lenRight = length(uvRight);",
    "float vignetteLeft = smoothstep(radius, radius-softness, lenLeft);",
    "float vignetteRight = smoothstep(radius, radius-softness, lenRight);",
    "float vignette = vignetteLeft + vignetteRight;",
    "vec3 final = mix (texel.rgb, texel.rgb * vignette, opacity);",
    "gl_FragColor = vec4(final.rgb, 1.0);",
    "}"
  ].join("\n")
};
