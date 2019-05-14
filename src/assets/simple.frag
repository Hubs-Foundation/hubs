precision mediump float;

uniform sampler2D u_image;
uniform int u_mic;
uniform int u_create;
uniform int u_pen;
uniform int u_cam;

varying vec2 v_uv;

void main() {
  vec4 color = texture2D(u_image, v_uv*vec2(1.0, 0.25));
  int button = int(color.r * 256.0); // 1 = mic, 2 = create, 4 = pen, 8 = camera
  float stepSize = color.g*256.0 / 512.0; //


  if (button == 1 || button == 2 || button == 4 || button == 8) {
    int steps = button == 1 ? u_mic :
      button == 2 ? u_create :
      button == 4 ? u_pen : u_cam;

    vec2 newUV = vec2(v_uv.x, v_uv.y*0.25 + 0.25 + stepSize * float(steps));
    vec4 color2 = texture2D(u_image, newUV);
    gl_FragColor = color2;
  } else {
    gl_FragColor = color;
  }
}
