#version 300 es
precision highp float;
precision highp int;
precision highp sampler2DArray;

layout(std140) uniform InstanceData {
  mat4 transforms[MAX_INSTANCES];
  vec4 colors[MAX_INSTANCES];
  vec4 uvTransforms[MAX_INSTANCES];
  vec4 mapSettings[MAX_INSTANCES];

  vec4 hubs_SweepParams[MAX_INSTANCES];

  vec3 hubs_InteractorOnePos;
  bool hubs_IsFrozen;

  vec3 hubs_InteractorTwoPos;
  float hubs_Time;

} instanceData;
in vec3 hubs_WorldPosition;
#ifdef PSEUDO_INSTANCING
flat in uint vInstance;
#endif


uniform sampler2DArray map;

in float fogDepth;
uniform vec3 fogColor;

// Fog Type
// 0.0 -> disabled
// 1.0 -> linear
// 2.0 -> exponential
uniform vec4 fogOptions; // r = type; g = density; b = near; a = far;

in vec2 vUv;
in vec4 vColor;
flat in vec4 vUVTransform;
flat in vec4 vMapSettings;

out vec4 outColor;

float applyWrapping(float value, int mode) {
  if (mode == 0) {
    // CLAMP_TO_EDGE - default
    return clamp(value, 0.0, 1.0);
  } else if (mode == 1) {
    // REPEAT
    return fract(value);
  } else {
    // MIRRORED_REPEAT
    float n = mod(value, 2.0);
    return mix(n, 2.0 - n, step(1.0, n));
  }
}

void main() {
  vec2 uv = vUv;

  int wrapS = int(vMapSettings.y);
  int wrapT = int(vMapSettings.z);
  uv.s = applyWrapping(uv.s, wrapS);
  uv.t = applyWrapping(uv.t, wrapT);

  vec2 uvMin = vUVTransform.xy;
  vec2 uvScale = vUVTransform.zw;
  uv = uvMin + uv * uvScale;

  int mapIdx = int(vMapSettings.x);
  outColor = texture(map, vec3(uv, mapIdx)) * vColor;
  if(outColor.a == 0.0) {
      discard;
  }

  bool hubs_HighlightInteractorOne = instanceData.hubs_SweepParams[vInstance].z > 0.0;
  bool hubs_HighlightInteractorTwo = instanceData.hubs_SweepParams[vInstance].w > 0.0;
  bool hubs_IsFrozen = instanceData.hubs_IsFrozen;

  if (hubs_HighlightInteractorOne || hubs_HighlightInteractorTwo || hubs_IsFrozen) {

      bool hubs_EnableSweepingEffect = true;
      vec2 hubs_SweepParams = instanceData.hubs_SweepParams[vInstance].xy;
      float hubs_Time = instanceData.hubs_Time;

      float ratio = 0.0;
      float size = hubs_SweepParams.t - hubs_SweepParams.s;

      if (hubs_EnableSweepingEffect) {
          float line = mod(hubs_Time / 500.0 * size, size * 3.0) + hubs_SweepParams.s - size / 3.0;

          if (hubs_WorldPosition.y < line) {
              // Highlight with a sweeping gradient.
              ratio = max(0.0, 1.0 - (line - hubs_WorldPosition.y) / (size * 1.5));
          }
      }

      // Highlight with a gradient falling off with distance.
      float pulse = 1.0 / (size + 0.2) * 8.0 + 1.0 / (size + 0.3) * 3.0 * (sin(hubs_Time / 1000.0) + 1.0);

      if (hubs_HighlightInteractorOne) {
          float dist1 = distance(hubs_WorldPosition, instanceData.hubs_InteractorOnePos);
          ratio += -min(1.0, pow(dist1 * pulse, 3.0)) + 1.0;
      }

      if (hubs_HighlightInteractorTwo) {
          float dist2 = distance(hubs_WorldPosition, instanceData.hubs_InteractorTwoPos);
          ratio += -min(1.0, pow(dist2 * pulse, 3.0)) + 1.0;
      }

      ratio = min(1.0, ratio);

      // Gamma corrected highlight color
      vec3 highlightColor = vec3(0.184, 0.499, 0.933);

      outColor = vec4((outColor.rgb * (1.0 - ratio)) + (highlightColor * ratio), outColor.a);
  }

  float fogType = fogOptions.r;

  if (fogType > 0.5) {
    float fogFactor = 0.0;

    if (fogType < 1.5) {
      float fogNear = fogOptions.z;
      float fogFar = fogOptions.w;
      fogFactor = smoothstep( fogNear, fogFar, fogDepth );
    } else {
      float fogDensity = fogOptions.y;
      fogFactor = 1.0 - exp( - fogDensity * fogDensity * fogDepth * fogDepth );
    }

    outColor.rgb = mix( outColor.rgb, fogColor, fogFactor );
  }
}
