uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

attribute mat4 a_mv;
attribute vec3 position;
attribute vec2 a_uvs;
varying vec2 v_uvs;
attribute float a_hubs_EnableSweepingEffect;
varying float v_hubs_EnableSweepingEffect;
attribute vec2 a_hubs_SweepParams;
varying vec2 v_hubs_SweepParams;
varying vec3 hubs_WorldPosition;

void main() {
  gl_Position = projectionMatrix * modelViewMatrix * a_mv * vec4(position, 1.0);
  v_uvs = a_uvs;
  v_hubs_EnableSweepingEffect = a_hubs_EnableSweepingEffect;
  v_hubs_SweepParams = a_hubs_SweepParams;

  vec4 wt = vec4(position, 1.0);
  hubs_WorldPosition = (a_mv * wt).xyz;
}
