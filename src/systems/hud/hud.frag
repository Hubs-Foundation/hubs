precision mediump float;

uniform sampler2D u_spritesheet;
uniform vec4 u_stencils[5];
uniform vec4 u_sprites[5];
varying vec2 v_uv;

bool contains_point( vec4 frame, vec2 uv ) {
  return uv.x > frame.x && uv.x < frame.x + frame.z
    && uv.y > frame.y && uv.y < frame.y + frame.w;
}

vec4 spriteColor( vec4 stencil, vec4 sprite, vec2 uv ) {
  float x = (uv.x - stencil.x) / (stencil.z);
  float y = (uv.y - stencil.y) / (stencil.w);

  float u = sprite.x + x * sprite.z;
  float v = sprite.y + y * sprite.w;

  return texture2D(u_spritesheet, vec2(u,v));
}

vec4 fragColor() {
  for (int i=0; i<5; i++){
    vec4 stencil = u_stencils[i];
    if ( contains_point( stencil, v_uv )) {
      vec4 sprite = u_sprites[i];
      return spriteColor( stencil, sprite, v_uv );
    }
  }
  return vec4(1,1,1,0);
}

void main() {
  gl_FragColor = fragColor();
}
