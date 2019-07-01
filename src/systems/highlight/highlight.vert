#version 300 es
precision highp float;
precision highp int;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform float hubs_Time;

in vec3 position;
out vec3 hubs_WorldPosition;

void main() {
    vec4 pos = vec4(position, 1.0);
    gl_Position = (projectionMatrix * modelViewMatrix * pos) - vec4(0,0,0.00002, 0);
    hubs_WorldPosition = (modelMatrix * pos).xyz;
}
