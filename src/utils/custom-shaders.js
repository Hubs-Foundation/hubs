export const custom_vertex = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const custom_fragment = `
#include <packing>  
varying vec2 vUv;
uniform sampler2D tDiffuse;
uniform sampler2D tDepth;
uniform float cameraNear;
uniform float cameraFar;

float readDepth( sampler2D depthSampler, vec2 coord ) {
  float fragCoordZ = texture2D( depthSampler, coord ).x;
  float viewZ = perspectiveDepthToViewZ( fragCoordZ, cameraNear, cameraFar );
  return viewZToOrthographicDepth( viewZ, cameraNear, cameraFar );
} 

void main() {
  float depth = readDepth(tDepth, vUv);
  float normalizedDepth = (depth - cameraNear) / (cameraFar - cameraNear);
  gl_FragColor.rgb = vec3(1.0-depth);
  gl_FragColor.a = 1.0;
}  
`;
