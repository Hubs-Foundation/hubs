#version 300 es
precision highp float;
precision highp int;

uniform float hubs_Time;
uniform vec2 hubs_SweepParams;

in vec3 hubs_WorldPosition;
out vec4 outColor;

void main() {
    float ratio = 0.0;

    float size = hubs_SweepParams.t - hubs_SweepParams.s;
    float line = mod(hubs_Time / 500.0 * size, size * 3.0) + hubs_SweepParams.s - size / 3.0;

    if (hubs_WorldPosition.y < line) {
    //     // Highlight with a sweeping gradient.
        ratio = max(0.0, 1.0 - (line - hubs_WorldPosition.y) / (size * 1.5));
    }

    // ratio = 1.0;

    vec4 highlightColor = vec4(0.184, 0.499, 0.933, 1);

    // gl_FragColor.rgb = (gl_FragColor.rgb * (1.0 - ratio)) + (highlightColor * ratio);
    outColor = highlightColor * vec4(1,1,1, ratio);
}
