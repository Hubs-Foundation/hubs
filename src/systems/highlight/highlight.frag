#version 300 es
precision highp float;
precision highp int;

uniform float hubs_Time;
uniform vec2 hubs_SweepParams;
uniform bool hubs_HighlightInteractorOne;
uniform vec3 hubs_InteractorOnePos;
uniform bool hubs_HighlightInteractorTwo;
uniform vec3 hubs_InteractorTwoPos;

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

    // Highlight with a gradient falling off with distance.
    float pulse = 9.0 + 3.0 * (sin(hubs_Time / 1000.0) + 1.0);

    if (hubs_HighlightInteractorOne) {
        float dist1 = distance(hubs_WorldPosition, hubs_InteractorOnePos);
        ratio += -min(1.0, pow(dist1 * pulse, 3.0)) + 1.0;
    }

    if (hubs_HighlightInteractorTwo) {
        float dist2 = distance(hubs_WorldPosition, hubs_InteractorTwoPos);
        ratio += -min(1.0, pow(dist2 * pulse, 3.0)) + 1.0;
    }

    ratio = min(1.0, ratio);

    vec4 highlightColor = vec4(0.184, 0.499, 0.933, 1);

    // gl_FragColor.rgb = (gl_FragColor.rgb * (1.0 - ratio)) + (highlightColor * ratio);
    outColor = highlightColor * vec4(1,1,1, ratio);
}
