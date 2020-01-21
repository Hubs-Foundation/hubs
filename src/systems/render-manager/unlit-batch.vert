#version 300 es
precision highp float;
precision highp int;

// Keep these separate so three only sets them once
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

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

out vec3 hubs_WorldPosition;
out float fogDepth;

in vec3 position;
in vec2 uv;

#ifdef PSEUDO_INSTANCING
in float instance;
flat out uint vInstance;
#endif

#ifdef VERTEX_COLORS
in vec3 color;
#endif

out vec2 vUv;
out vec4 vColor;

flat out vec4 vUVTransform;
flat out vec4 vMapSettings;

void main() {
  #ifdef PSEUDO_INSTANCING
  uint instanceIndex = uint(instance);
  #elif
  uint instanceIndex = gl_InstanceID;
  #endif

  vColor = instanceData.colors[instanceIndex];

  #ifdef VERTEX_COLORS
  vColor *= vec4(color, 1.0);
  #endif

  vUv = uv;
  vUVTransform = instanceData.uvTransforms[instanceIndex];
  vMapSettings = instanceData.mapSettings[instanceIndex];

  vec4 mvPosition = viewMatrix * instanceData.transforms[instanceIndex] * vec4(position, 1.0);

  gl_Position = projectionMatrix * mvPosition;

  hubs_WorldPosition = (instanceData.transforms[instanceIndex] * vec4(position, 1.0)).xyz;
  vInstance = instanceIndex;

  fogDepth = -mvPosition.z;
}
