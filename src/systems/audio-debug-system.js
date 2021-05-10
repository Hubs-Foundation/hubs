import { THREE } from "aframe";

const MAX_DEBUG_SOURCES = 64;

const CONE_VERTEX = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main()
  {
    vNormal = normalize(normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    vUv = position.xz;
  }
`;
const CONE_FRAG = `
  // Based on: https://www.shadertoy.com/view/Mll3D4#
  varying vec2 vUv;
  varying vec3 vNormal;
  uniform float time;

  const int LINEAR = 0;
  const int INVERSE = 1;
  const int EXPONENTIAL = 2;
          
  uniform vec3 colorInner;
  uniform vec3 colorOuter;
  uniform vec3 colorGain;
  uniform int positionsNum;
  uniform vec3 positions[${MAX_DEBUG_SOURCES}];
  uniform vec3 orientations[${MAX_DEBUG_SOURCES}];
  uniform float maxDistance[${MAX_DEBUG_SOURCES}];
  uniform float refDistance[${MAX_DEBUG_SOURCES}];
  uniform float rolloffFactor[${MAX_DEBUG_SOURCES}];
  uniform int distanceModel[${MAX_DEBUG_SOURCES}];
  uniform float coneInnerAngle[${MAX_DEBUG_SOURCES}];
  uniform float coneOuterAngle[${MAX_DEBUG_SOURCES}];
  uniform float gain[${MAX_DEBUG_SOURCES}];
  uniform bool clipped[${MAX_DEBUG_SOURCES}];

  const float kPi = 3.141592;
  const float kDegToRad = kPi / 180.0;
  const float kInvPi = 1.0 / 3.141592;
  const float kRefDistWidth = 0.05;

  float att_linear(float x, float rolloff, float dref, float dmax) {
    return 1.0-(rolloff*((x-dref)/(dmax-dref)));
  }

  float att_inverse(float x, float rolloff, float dref) {
    return dref/(dref+(rolloff*(max(x, dref)-dref)));
  }

  float att_exponential(float x, float rolloff, float dref) {
    return pow((max(x, dref)/dref),-rolloff);
  }

  vec4 circle(vec2 center, float d, float len, float radius, float holeRadius, vec3 color, float offset) {  
    // Define how blurry the circle should be. 
    // A value of 1.0 means 'sharp', larger values
    // will increase the bluriness.
    float bluriness = 1.0;
    
    // Calculate angle, so we can draw segments, too.
    float angle = atan( center.x, center.y ) * kInvPi * 0.5;
    angle = fract( angle + offset);
    
    // Create an anti-aliased circle.
    float wd = bluriness * fwidth( d );
    float circle = smoothstep( radius + wd, radius - wd, d );
    
    // Optionally, you could create a hole in it:
    float inner = holeRadius;
    circle -= smoothstep( inner + wd, inner - wd, d );
    
    // Or only draw a portion (segment) of the circle.
    float wa = bluriness * fwidth( angle );
    float segment = smoothstep( len + wa, len - wa, angle );
	  segment *= smoothstep( 0.0, 2.0 * wa, angle );
    circle *= mix( segment, 1.0, step( 1.0, len ) );
        
    // Let's define the circle's color now.
    vec3 rgb = color * circle;
    
    // Output final color.
    return vec4( rgb, circle);
  }

  vec4 att(float d, vec4 circle, float maxDistance, float refDistance, float rolloffFactor, int distanceModel) {
    // Calculate attenuation
    float attenuation = 1.0;
    if (distanceModel == LINEAR) {
      attenuation = att_linear(d, rolloffFactor, refDistance, maxDistance);
    } else if (distanceModel == INVERSE) {
      attenuation = att_inverse(d, rolloffFactor, refDistance);
    } else if (distanceModel == EXPONENTIAL) {
      attenuation = att_exponential(d, rolloffFactor, refDistance);
    }
    attenuation = clamp(attenuation, 0.0, 1.0);

    // Waves
    float v = sin((d * 2.0 * kPi) - (time * 0.005)) + 1.0;
    float waves = circle.a * attenuation * v * vNormal.y;
    
    // Output final color.
    return vec4( circle.rgb, waves );
  }

  void main() {
    // Draw background
    vec4 background = vec4(1.0, 1.0, 1.0, 0.0);

    for (int i=0; i<positionsNum; i++) {
      vec2 center = positions[i].xz - vUv;

      // Calculate distance to (0,0).
      float d = length( center );

      // Optional start Offset.
      vec2 orientation = normalize(orientations[i].xz);
      float ang = atan(-orientation.x, orientation.y) * kInvPi * 0.5;
      // Rotate to sart drawing facing front
      ang -= 0.5;
      float startOffset = mod(ang, 1.0);

      // Draw inner circle
      float innerAngle = coneInnerAngle[i] * kDegToRad * kInvPi * 0.5;
      float innerStartAngle = startOffset + innerAngle * 0.5;
      vec4 innerLayer = circle(center, d, innerAngle, 10000.0, 1.0, colorInner, innerStartAngle);
      innerLayer = att(d, innerLayer, maxDistance[i], refDistance[i], rolloffFactor[i], distanceModel[i]);
      background = mix(background, innerLayer, innerLayer.a);

      // Draw outer circle
      float outerAngle = coneOuterAngle[i] * kDegToRad * kInvPi * 0.5;
      float outerAngleDiffHalf = (outerAngle - innerAngle) * 0.5;
      vec4 outerLayer1 = circle(center, d, outerAngleDiffHalf, 10000.0, 1.0, colorOuter, innerStartAngle + outerAngleDiffHalf);
      outerLayer1 = att(d, outerLayer1, maxDistance[i], refDistance[i], rolloffFactor[i], distanceModel[i]);
      background = mix(background, outerLayer1, outerLayer1.a);
      vec4 outerLayer2 = circle(center, d, outerAngleDiffHalf, 10000.0, 1.0, colorOuter, innerStartAngle - innerAngle);
      outerLayer2 = att(d, outerLayer2, maxDistance[i], refDistance[i], rolloffFactor[i], distanceModel[i]);
      background = mix(background, outerLayer2, outerLayer2.a);

      // Draw base
      vec4 baseLayer = circle(center, d, 1.0, refDistance[i], 0.1, vec3(0.5, 0.5, 0.5), 0.0);
      background = mix(background, baseLayer, baseLayer.a);

      // Draw gain
      float g = clamp(gain[i], 0.0, 1.0);
      vec4 gainLayer = circle(center, d, g, refDistance[i], 0.5, colorGain, startOffset);
      background = mix(background, gainLayer, gainLayer.a);
      if (gain[i] > 1.0) {
        vec4 overGainLayer = circle(center, d, gain[i] - g, refDistance[i], 0.5, vec3(1.0, 0.0, 0.0), startOffset);
        background = mix(background, overGainLayer, overGainLayer.a);
      }
    }
    
    // Blend
    gl_FragColor = vec4(background.rgb, background.a * vNormal.y);
  }
`;

AFRAME.registerSystem("audio-debug", {
  schema: {
    enabled: { default: false }
  },

  init() {
    window.APP.store.addEventListener("statechanged", this.updateState.bind(this));

    this.sources = [];

    this.material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        colorInner: { value: new THREE.Color("#7AFF59") },
        colorOuter: { value: new THREE.Color("#FF6340") },
        colorGain: { value: new THREE.Color("#70DBFF") },
        positionsNum: { value: 0 },
        maxDistance: { value: [] },
        refDistance: { value: [] },
        rolloffFactor: { value: [] },
        distanceModel: { value: [] },
        positions: { value: [] },
        orientations: { value: [] },
        coneInnerAngle: { value: [] },
        coneOuterAngle: { value: [] },
        gain: { value: [] },
        clipped: { value: [] }
      },
      vertexShader: CONE_VERTEX,
      fragmentShader: CONE_FRAG
    });
    this.material.side = THREE.FrontSide;
    this.material.transparent = true;
    this.material.uniforms.positionsNum.value = 0;

    this.sourcesPos = new Array(MAX_DEBUG_SOURCES);
    this.orientations = new Array(MAX_DEBUG_SOURCES);
    this.distanceModels = new Array(MAX_DEBUG_SOURCES);
    this.maxDistances = new Array(MAX_DEBUG_SOURCES);
    this.refDistances = new Array(MAX_DEBUG_SOURCES);
    this.rolloffFactors = new Array(MAX_DEBUG_SOURCES);
    this.coneInnerAngles = new Array(MAX_DEBUG_SOURCES);
    this.coneOuterAngles = new Array(MAX_DEBUG_SOURCES);
    this.gains = new Array(MAX_DEBUG_SOURCES);
    this.clipped = new Array(MAX_DEBUG_SOURCES);
  },

  remove() {
    window.APP.store.removeEventListener("statechanged", this.updateState);
  },

  registerSource(source) {
    this.sources.push(source);
  },

  unregisterSource(source) {
    const index = this.sources.indexOf(source);

    if (index !== -1) {
      this.sources.splice(index, 1);
    }
  },

  tick(time) {
    if (!this.data.enabled) {
      return;
    }

    this.sourcesPos.fill(new THREE.Vector3());
    this.orientations.fill(new THREE.Vector3());
    this.distanceModels.fill(0);
    this.maxDistances.fill(0.0);
    this.refDistances.fill(0.0);
    this.rolloffFactors.fill(0.0);
    this.coneInnerAngles.fill(0.0);
    this.coneOuterAngles.fill(0.0);
    this.gains.fill(0.0);
    this.clipped.fill(0.0);

    let sourceNum = 0;
    this.sources.forEach(source => {
      if (source.data.enabled) {
        if (sourceNum < MAX_DEBUG_SOURCES) {
          this.sourcesPos[sourceNum] = source.data.position;
          this.orientations[sourceNum] = source.data.orientation;
          this.distanceModels[sourceNum] = 0;
          if (source.data.distanceModel === "linear") {
            this.distanceModels[sourceNum] = 0;
          } else if (source.data.distanceModel === "inverse") {
            this.distanceModels[sourceNum] = 1;
          } else if (source.data.distanceModel === "exponential") {
            this.distanceModels[sourceNum] = 2;
          }
          this.maxDistances[sourceNum] = source.data.maxDistance;
          this.refDistances[sourceNum] = source.data.refDistance;
          this.rolloffFactors[sourceNum] = source.data.rolloffFactor;
          this.coneInnerAngles[sourceNum] = source.data.coneInnerAngle;
          this.coneOuterAngles[sourceNum] = source.data.coneOuterAngle;
          this.gains[sourceNum] = source.data.gain;
          this.clipped[sourceNum] = source.data.isClipped;
          sourceNum++;
        }
      }
    });

    // Update material uniforms
    this.material.uniforms.time.value = time;
    this.material.uniforms.distanceModel.value = this.distanceModels;
    this.material.uniforms.maxDistance.value = this.maxDistances;
    this.material.uniforms.refDistance.value = this.refDistances;
    this.material.uniforms.rolloffFactor.value = this.rolloffFactors;
    this.material.uniforms.positions.value = this.sourcesPos;
    this.material.uniforms.orientations.value = this.orientations;
    this.material.uniforms.positionsNum.value = sourceNum;
    this.material.uniforms.coneInnerAngle.value = this.coneInnerAngles;
    this.material.uniforms.coneOuterAngle.value = this.coneOuterAngles;
    this.material.uniforms.gain.value = this.gains;
    this.material.uniforms.clipped.value = this.clipped;
  },

  enableDebugMode(enabled) {
    if (enabled === undefined || enabled === this.data.enabled) return;
    const envRoot = document.getElementById("environment-root");
    const meshEl = envRoot.querySelector(".trimesh") || envRoot.querySelector(".navMesh");
    if (meshEl) {
      this.data.enabled = enabled;
      const navMesh = meshEl.object3D;
      navMesh.visible = enabled;
      navMesh.traverse(obj => {
        if (obj.material && obj instanceof THREE.Mesh) {
          obj.visible = enabled;
          if (obj.material) {
            if (enabled) {
              obj._hubs_audio_debug_material = obj.material;
              obj.material = this.material;
            } else {
              obj.material = obj._hubs_audio_debug_material;
              obj._hubs_audio_debug_material = null;
            }
            obj.material.needsUpdate = true;
            obj.geometry.computeFaceNormals();
            obj.geometry.computeVertexNormals();
          }
        }
      });
    } else {
      this.data.enabled = false;
    }
  },

  updateState() {
    const isEnabled = window.APP.store.state.preferences.showAudioDebugView;
    if (isEnabled !== undefined && isEnabled !== this.data.enabled) {
      this.enableDebugMode(isEnabled);
    }
  }
});
