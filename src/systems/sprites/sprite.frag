#version 300 es

precision mediump float;

uniform sampler2D u_spritesheet;

in vec2 v_uvs;
out vec4 outColor;

void main() {
  outColor = texture(u_spritesheet, v_uvs);
}
