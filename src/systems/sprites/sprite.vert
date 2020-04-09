attribute vec4 mvCol0;
attribute vec4 mvCol1;
attribute vec4 mvCol2;
attribute vec4 mvCol3;
attribute vec3 position;
attribute vec2 a_uvs;
varying vec2 v_uvs;
attribute float a_hubs_EnableSweepingEffect;
varying float v_hubs_EnableSweepingEffect;
attribute vec2 a_hubs_SweepParams;
varying vec2 v_hubs_SweepParams;
varying vec3 hubs_WorldPosition;

void main() {
  mat4 mv = mat4(mvCol0, mvCol1, mvCol2, mvCol3);
  gl_Position = projectionMatrix * modelViewMatrix * mv * vec4(position, 1.0);
  v_uvs = a_uvs;
  v_hubs_EnableSweepingEffect = a_hubs_EnableSweepingEffect;
  v_hubs_SweepParams = a_hubs_SweepParams;

  vec4 wt = vec4(position, 1.0);
  hubs_WorldPosition = (mv * wt).xyz;
}
