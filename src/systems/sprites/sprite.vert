#version 300 es

in vec4 mvCol0;
in vec4 mvCol1;
in vec4 mvCol2;
in vec4 mvCol3;
in vec3 a_vertices;
in vec2 a_uvs;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

in float a_hubs_EnableSweepingEffect;
in vec2 a_hubs_SweepParams;
flat out float v_hubs_EnableSweepingEffect;
flat out vec2 v_hubs_SweepParams;
out vec3 hubs_WorldPosition;
uniform bool hubs_IsFrozen;

out vec2 v_uvs;

void main() {
  mat4 mv = mat4(mvCol0, mvCol1, mvCol2, mvCol3);
  gl_Position = projectionMatrix * modelViewMatrix * mv * vec4(a_vertices, 1.0);
  v_uvs = a_uvs;
  v_hubs_EnableSweepingEffect = a_hubs_EnableSweepingEffect;
  v_hubs_SweepParams = a_hubs_SweepParams;

  if (hubs_IsFrozen) {
    vec4 wt = vec4(a_vertices, 1.0);

    hubs_WorldPosition = (mv * wt).xyz;
  }
}
