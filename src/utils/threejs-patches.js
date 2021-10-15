// Older Three.js Raycast API ignored invisible objects before
// but the newer one determines whther to ignore or not based on layers.
//
// Change
// https://github.com/mrdoob/three.js/commit/4ce5ba209c6d1712e3728726b0126c34c237a626#diff-e9ba2746300f68606637fd8769a722f23924e93ecb2aefead0163ba251d3e888
// Context
// https://github.com/mrdoob/three.js/issues/14700
//
// We Hubs currently rely on the older Raycast API.
// Switching to the new one for us requires a bunch of code change.
// We want to update our code later so we apply a monkeypatch to Three.js Raycast API so far.

function intersectObject(object, raycaster, intersects, recursive) {
  if (object.visible === false) {
    return;
  }

  object.raycast(raycaster, intersects);

  if (recursive === true) {
    const children = object.children;
    for (let i = 0, l = children.length; i < l; i++) {
      intersectObject(children[i], raycaster, intersects, true);
    }
  }
}

function ascSort(a, b) {
  return a.distance - b.distance;
}

THREE.Raycaster.prototype.intersectObject = function(object, recursive = false, intersects = []) {
  intersectObject(object, this, intersects, recursive);
  intersects.sort(ascSort);
  return intersects;
};

THREE.Raycaster.prototype.intersectObjects = function(objects, recursive = false, intersects = []) {
  for (let i = 0, l = objects.length; i < l; i++) {
    intersectObject(objects[i], this, intersects, recursive);
  }
  intersects.sort(ascSort);
  return intersects;
};

// Upstream THREE assumes equirect textures have flipY = true, but we set it to false. Patch to support both.
// Only patched line is the texture.flipY line in the fragment shader.
THREE.WebGLCubeRenderTarget.prototype.fromEquirectangularTexture = function(renderer, texture) {
  this.texture.type = texture.type;
  this.texture.format = THREE.RGBAFormat; // see #18859
  this.texture.encoding = texture.encoding;

  this.texture.generateMipmaps = texture.generateMipmaps;
  this.texture.minFilter = texture.minFilter;
  this.texture.magFilter = texture.magFilter;

  const shader = {
    uniforms: {
      tEquirect: { value: null }
    },

    vertexShader: /* glsl */ `

        varying vec3 vWorldDirection;

        vec3 transformDirection( in vec3 dir, in mat4 matrix ) {

          return normalize( ( matrix * vec4( dir, 0.0 ) ).xyz );

        }

        void main() {

          vWorldDirection = transformDirection( position, modelMatrix );

          #include <begin_vertex>
          #include <project_vertex>

        }
      `,

    fragmentShader: /* glsl */ `

        uniform sampler2D tEquirect;

        varying vec3 vWorldDirection;

        #include <common>

        void main() {

          vec3 direction = normalize( vWorldDirection );

          vec2 sampleUV = equirectUv( direction );
          ${!texture.flipY ? "sampleUV.y = 1.0 - sampleUV.y;" : ""}

          gl_FragColor = texture2D( tEquirect, sampleUV );

        }
      `
  };

  const geometry = new THREE.BoxGeometry(5, 5, 5);

  const material = new THREE.ShaderMaterial({
    name: "CubemapFromEquirect",

    uniforms: THREE.UniformsUtils.clone(shader.uniforms),
    vertexShader: shader.vertexShader,
    fragmentShader: shader.fragmentShader,
    side: THREE.BackSide,
    blending: THREE.NoBlending
  });

  material.uniforms.tEquirect.value = texture;

  const mesh = new THREE.Mesh(geometry, material);

  const currentMinFilter = texture.minFilter;

  // Avoid blurred poles
  if (texture.minFilter === THREE.LinearMipmapLinearFilter) texture.minFilter = THREE.LinearFilter;

  const camera = new THREE.CubeCamera(1, 10, this);
  camera.update(renderer, mesh);

  texture.minFilter = currentMinFilter;

  mesh.geometry.dispose();
  mesh.material.dispose();

  return this;
};

// Audio and PositionalAudio do not implement clone/copy. This results in calls to cloneObject3D failing.
// The following patch implements clone and copy with the limitation that filters and audio source nodes
// will not be cloned. They will reference the original object.
THREE.Audio.prototype.clone = function(recursive) {
  return new this.constructor(this.listener).copy(this, recursive);
};

THREE.Audio.prototype.copy = function(source, recursive) {
  THREE.Object3D.prototype.copy.call(this, source, recursive);

  this.buffer = source.buffer;
  this.detune = source.detune;
  this.loop = source.loop;
  this.loopStart = source.loopStart;
  this.loopEnd = source.loopEnd;
  this.offset = source.offset;
  this.duration = source.duration;
  this.playbackRate = source.playbackRate;
  this.hasPlaybackControl = source.hasPlaybackControl;
  this.source = source.source;
  this.sourceType = source.sourceType;
  this.gain.gain.value = source.gain.gain.value;

  if (source.filters.length > 0) {
    console.warn("Cloning Audio filters is not supported");
  }

  this.filters = source.filters.slice();

  if (this.source) {
    this.source.detune.value = source.source.detune.value;
    this.source.playbackRate.value = source.source.playbackRate.value;
    this.source.loop = source.source.loop;
    this.connect();
  }

  if (source.isPlaying) {
    this.play();
  }

  return this;
};

THREE.PositionalAudio.prototype.clone = function(recursive) {
  return new this.constructor(this.listener).copy(this, recursive);
};

THREE.PositionalAudio.prototype.copy = function(source, recursive) {
  this.panner.refDistance = source.panner.refDistance;
  this.panner.rolloffFactor = source.panner.rolloffFactor;
  this.panner.distanceModel = source.panner.distanceModel;
  this.panner.maxDistance = source.panner.maxDistance;
  this.panner.coneInnerAngle = source.panner.coneInnerAngle;
  this.panner.coneOuterAngle = source.panner.coneOuterAngle;
  this.panner.coneOuterGain = source.panner.coneOuterGain;

  THREE.Audio.prototype.copy.call(this, source, recursive);

  return this;
};
