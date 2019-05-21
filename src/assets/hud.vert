attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 v_uv;

void main() {
  gl_Position = projectionMatrix*modelViewMatrix*vec4(position, 1.0);
  v_uv = uv;
}

//uvs : ​​
//0 1
//1 1
//0 0
//1 0
//​
//positions :
//-0.5 ​ 0.5  0
//0.5  0.5  0
//-0.5 -0.5  0
//0.5 -0.5  0
//
//index:
//0 2 1
//2 3 1
//
//
//
//0                          1
//-0.5, 0.5                 0.5, 0.5
//  0   1                     1  1
//
//
//
//  2                          3
//  -0.5, -0.5                0.5, -0.5
//  0   0                     1   0
