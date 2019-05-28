#version 300 es

in vec4 mvCol0;
in vec4 mvCol1;
in vec4 mvCol2;
in vec4 mvCol3;
in vec3 a_vertices;
in vec2 a_uvs;
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

out vec2 v_uvs;

void main() {
  mat4 mv = mat4(mvCol0, mvCol1, mvCol2, mvCol3);
  gl_Position = projectionMatrix * modelViewMatrix * mv * vec4(a_vertices, 1.0);
  v_uvs = a_uvs;
}
