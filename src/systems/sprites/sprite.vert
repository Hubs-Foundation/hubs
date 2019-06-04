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
flat out float v_hubs_EnableSweepingEffect;
out vec3 hubs_WorldPosition;
uniform bool hubs_IsFrozen;
uniform bool hubs_HighlightInteractorOne;
uniform bool hubs_HighlightInteractorTwo;

out vec2 v_uvs;

void main() {
  mat4 mv = mat4(mvCol0, mvCol1, mvCol2, mvCol3);
  gl_Position = projectionMatrix * modelViewMatrix * mv * vec4(a_vertices, 1.0);
  v_uvs = a_uvs;
  v_hubs_EnableSweepingEffect = a_hubs_EnableSweepingEffect;

  if (hubs_HighlightInteractorOne || hubs_HighlightInteractorTwo || hubs_IsFrozen) {
    vec4 wt = vec4(a_vertices, 1.0);

    // Used in the fragment shader below.
    hubs_WorldPosition = wt.xyz;
  }
}
