#version 300 es

precision mediump float;

uniform sampler2D u_spritesheet;

in vec2 v_uvs;
out vec4 outColor;

flat in float v_hubs_EnableSweepingEffect;
in vec3 hubs_WorldPosition;
uniform bool hubs_IsFrozen;
uniform vec2 hubs_SweepParams;
uniform bool hubs_HighlightInteractorOne;
uniform vec3 hubs_InteractorOnePos;
uniform bool hubs_HighlightInteractorTwo;
uniform vec3 hubs_InteractorTwoPos;
uniform float hubs_Time;

#define GAMMA_FACTOR 2.2

vec4 LinearToGamma( in vec4 value, in float gammaFactor ) {
  return vec4( pow( value.rgb, vec3( 1.0 / gammaFactor ) ), value.a );
}

vec4 linearToOutputTexel( vec4 value ) {
  return LinearToGamma( value, float( GAMMA_FACTOR ) );
}

void main() {
    vec4 texColor = texture(u_spritesheet, v_uvs);

    if (hubs_HighlightInteractorOne || hubs_HighlightInteractorTwo || hubs_IsFrozen) {
        float ratio = 0.0;
        if (v_hubs_EnableSweepingEffect - 0.9 > 0.0 ) {
            float size = (hubs_SweepParams.t - hubs_SweepParams.s) * 1.0;
            float line = mod(hubs_Time / 500.0 * size, size * 3.0) + hubs_SweepParams.s - size / 3.0;
            if (hubs_WorldPosition.y < line) {
                // Highlight with a sweeping gradient.
                ratio = max(0.0, 1.0 - (line - hubs_WorldPosition.y) / (size * 1.5));
            }

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

        // Gamma corrected highlight color

        vec4 highlightColor = linearToOutputTexel(vec4(0.184, 0.499, 0.933, 1.0));
        outColor = vec4(0.0,0.0,0.0,0.0);
        outColor.rgb = (texColor.rgb * (1.0 - ratio)) + (highlightColor.rgb * ratio);
        outColor.a = texColor.a;
    }
}
