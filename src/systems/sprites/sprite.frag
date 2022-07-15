precision mediump float;

uniform sampler2D u_spritesheet;

varying vec2 v_uvs;

varying float v_hubs_EnableSweepingEffect;
varying vec2 v_hubs_SweepParams;
varying vec3 hubs_WorldPosition;
uniform bool hubs_HighlightInteractorOne;
uniform vec3 hubs_InteractorOnePos;
uniform bool hubs_HighlightInteractorTwo;
uniform vec3 hubs_InteractorTwoPos;
uniform float hubs_Time;

vec4 LinearTosRGB( in vec4 value ) {
    return vec4( mix( pow( value.rgb, vec3( 0.41666 ) ) * 1.055 - vec3( 0.055 ), value.rgb * 12.92, vec3( lessThanEqual( value.rgb, vec3( 0.0031308 ) ) ) ), value.a );
}

vec4 linearToOutputTexel( vec4 value ) {
  return LinearTosRGB( value );
}

void main() {
    vec4 texColor = texture2D(u_spritesheet, v_uvs);

    float ratio = 0.0;
    if (v_hubs_EnableSweepingEffect > 0.9 ) {
        float size = v_hubs_SweepParams.t - v_hubs_SweepParams.s * 1.0;
        float line = mod(hubs_Time / 500.0 * size, size * 3.0) + v_hubs_SweepParams.s - size / 3.0;
        if (hubs_WorldPosition.y < line) {
            ratio = max(0.0, 1.0 - (line - hubs_WorldPosition.y) / (size * 1.5));
        }

    }
    ratio = min(1.0, ratio);

    vec4 highlightColor = vec4(0.184, 0.499, 0.933, 1.0);
    gl_FragColor = linearToOutputTexel(vec4((texColor.rgb * (1.0 - ratio)) + (highlightColor.rgb * ratio), texColor.a));
}
