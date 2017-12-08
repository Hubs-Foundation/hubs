import { Layers } from "./layers";
/**
 * @author jbouny / https://github.com/jbouny
 *
 * Work based on :
 * @author Slayvin / http://slayvin.net : Flat mirror for three.js
 * @author Stemkoski / http://www.adelphi.edu/~stemkoski : An implementation of water shader based on the flat mirror
 * @author Jonas Wagner / http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */

function CubeCamera(near, far, cubeResolution, layers) {
  THREE.Object3D.call(this);

  this.type = "CubeCamera";

  let fov = 90,
    aspect = 1;

  const cameraPX = new THREE.PerspectiveCamera(fov, aspect, near, far);
  cameraPX.up.set(0, -1, 0);
  cameraPX.lookAt(new THREE.Vector3(1, 0, 0));
  cameraPX.layers.set(layers);
  this.add(cameraPX);

  const cameraNX = new THREE.PerspectiveCamera(fov, aspect, near, far);
  cameraNX.up.set(0, -1, 0);
  cameraNX.lookAt(new THREE.Vector3(-1, 0, 0));
  cameraNX.layers.set(layers);
  this.add(cameraNX);

  const cameraPY = new THREE.PerspectiveCamera(fov, aspect, near, far);
  cameraPY.up.set(0, 0, 1);
  cameraPY.lookAt(new THREE.Vector3(0, 1, 0));
  cameraPY.layers.set(layers);
  this.add(cameraPY);

  const cameraNY = new THREE.PerspectiveCamera(fov, aspect, near, far);
  cameraNY.up.set(0, 0, -1);
  cameraNY.lookAt(new THREE.Vector3(0, -1, 0));
  cameraNY.layers.set(layers);
  this.add(cameraNY);

  const cameraPZ = new THREE.PerspectiveCamera(fov, aspect, near, far);
  cameraPZ.up.set(0, -1, 0);
  cameraPZ.lookAt(new THREE.Vector3(0, 0, 1));
  cameraPZ.layers.set(layers);
  this.add(cameraPZ);

  const cameraNZ = new THREE.PerspectiveCamera(fov, aspect, near, far);
  cameraNZ.up.set(0, -1, 0);
  cameraNZ.lookAt(new THREE.Vector3(0, 0, -1));
  cameraNZ.layers.set(layers);
  this.add(cameraNZ);

  const options = {
    format: THREE.RGBFormat,
    magFilter: THREE.LinearFilter,
    minFilter: THREE.LinearFilter
  };

  this.renderTarget = new THREE.WebGLRenderTargetCube(
    cubeResolution,
    cubeResolution,
    options
  );
  this.renderTarget.texture.name = "CubeCamera";

  this.update = function(renderer, scene) {
    if (this.parent === null) this.updateMatrixWorld();

    const renderTarget = this.renderTarget;
    const generateMipmaps = renderTarget.texture.generateMipmaps;

    renderTarget.texture.generateMipmaps = false;

    renderTarget.activeCubeFace = 0;
    renderer.render(scene, cameraPX, renderTarget);

    renderTarget.activeCubeFace = 1;
    renderer.render(scene, cameraNX, renderTarget);

    renderTarget.activeCubeFace = 2;
    renderer.render(scene, cameraPY, renderTarget);

    renderTarget.activeCubeFace = 3;
    renderer.render(scene, cameraNY, renderTarget);

    renderTarget.activeCubeFace = 4;
    renderer.render(scene, cameraPZ, renderTarget);

    renderTarget.texture.generateMipmaps = generateMipmaps;

    renderTarget.activeCubeFace = 5;
    renderer.render(scene, cameraNZ, renderTarget);

    renderer.setRenderTarget(null);
  };

  this.clear = function(renderer, color, depth, stencil) {
    const renderTarget = this.renderTarget;

    for (let i = 0; i < 6; i++) {
      renderTarget.activeCubeFace = i;
      renderer.setRenderTarget(renderTarget);

      renderer.clear(color, depth, stencil);
    }

    renderer.setRenderTarget(null);
  };
}

CubeCamera.prototype = Object.create(THREE.Object3D.prototype);
CubeCamera.prototype.constructor = CubeCamera;

THREE.Water = function(geometry, options) {
  THREE.Mesh.call(this, geometry);

  const scope = this;

  options = options || {};

  const clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;
  const time = options.time !== undefined ? options.time : 0.0;
  const normalSampler =
    options.waterNormals !== undefined ? options.waterNormals : null;
  const sunDirection =
    options.sunDirection !== undefined
      ? options.sunDirection
      : new THREE.Vector3(0.70707, 0.70707, 0.0);
  const sunColor = new THREE.Color(
    options.sunColor !== undefined ? options.sunColor : 0xffffff
  );
  const waterColor = new THREE.Color(
    options.waterColor !== undefined ? options.waterColor : 0x7f7f7f
  );
  const eye =
    options.eye !== undefined ? options.eye : new THREE.Vector3(0, 0, 0);
  const distortionScale =
    options.distortionScale !== undefined ? options.distortionScale : 20.0;
  const side = options.side !== undefined ? options.side : THREE.FrontSide;
  const fog = options.fog !== undefined ? options.fog : false;

  const mirrorCamera = new CubeCamera(1, 100000, 512, options.layers);
  this.add(mirrorCamera);

  const mirrorShader = {
    uniforms: THREE.UniformsUtils.merge([
      THREE.UniformsLib["lights"],
      {
        normalSampler: { value: null },
        mirrorSampler: { value: null },
        time: { value: 0.0 },
        size: { value: 1.0 },
        distortionScale: { value: 20.0 },
        sunColor: { value: new THREE.Color(0x7f7f7f) },
        sunDirection: { value: new THREE.Vector3(0.70707, 0.70707, 0) },
        eye: { value: new THREE.Vector3() },
        waterColor: { value: new THREE.Color(0x555555) }
      }
    ]),

    vertexShader: `
      uniform float time;

      varying vec4 mirrorCoord;
      varying vec4 worldPosition;

      void main() {
      	mirrorCoord = modelMatrix * vec4( position, 1.0 );
      	worldPosition = mirrorCoord.xyzw;
      	vec4 mvPosition =  modelViewMatrix * vec4( position, 1.0 );
      	gl_Position = projectionMatrix * mvPosition;

      }
    `,

    fragmentShader: `
      uniform samplerCube mirrorSampler;
      uniform float time;
      uniform float size;
      uniform float distortionScale;
      uniform sampler2D normalSampler;
      uniform vec3 sunColor;
      uniform vec3 sunDirection;
      uniform vec3 eye;
      uniform vec3 waterColor;

      varying vec4 mirrorCoord;
      varying vec4 worldPosition;

      vec4 getNoise( vec2 uv ) {
      	vec2 uv0 = ( uv / 103.0 ) + vec2(time / 17.0, time / 29.0);
      	vec2 uv1 = uv / 107.0-vec2( time / -19.0, time / 31.0 );
      	vec2 uv2 = uv / vec2( 8907.0, 9803.0 ) + vec2( time / 101.0, time / 97.0 );
      	vec2 uv3 = uv / vec2( 1091.0, 1027.0 ) - vec2( time / 109.0, time / -113.0 );
      	vec4 noise = texture2D( normalSampler, uv0 ) +
      		texture2D( normalSampler, uv1 ) +
      		texture2D( normalSampler, uv2 ) +
      		texture2D( normalSampler, uv3 );
      	return noise * 0.5 - 1.0;
      }

      void sunLight( const vec3 surfaceNormal, const vec3 eyeDirection, float shiny, float spec, float diffuse, inout vec3 diffuseColor, inout vec3 specularColor ) {
      	vec3 reflection = normalize( reflect( -sunDirection, surfaceNormal ) );
      	float direction = max( 0.0, dot( eyeDirection, reflection ) );
      	specularColor += pow( direction, shiny ) * sunColor * spec;
      	diffuseColor += max( dot( sunDirection, surfaceNormal ), 0.0 ) * sunColor * diffuse;
      }

      ${THREE.ShaderChunk["common"]}
      ${THREE.ShaderChunk["packing"]}
      ${THREE.ShaderChunk["bsdfs"]}
      ${THREE.ShaderChunk["lights_pars"]}

      void main() {
      	vec4 noise = getNoise( worldPosition.xz * size );
      	vec3 surfaceNormal = normalize( noise.xzy * vec3( 1.5, 1.0, 1.5 ) );

      	vec3 diffuseLight = vec3(0.0);
      	vec3 specularLight = vec3(0.0);

      	vec3 worldToEye = eye-worldPosition.xyz;
      	vec3 eyeDirection = normalize( worldToEye );
      	sunLight( surfaceNormal, eyeDirection, 100.0, 2.0, 0.5, diffuseLight, specularLight );

      	float distance = length(worldToEye);

      	vec2 distortion = surfaceNormal.xz * ( 0.001 + 1.0 / distance ) * distortionScale;
      	vec3 reflectionSample = vec3( textureCube( mirrorSampler, mirrorCoord.xyz ) );

      	float theta = max( dot( eyeDirection, surfaceNormal ), 0.0 );
      	float rf0 = 0.3;
      	float reflectance = rf0 + ( 1.0 - rf0 ) * pow( ( 1.0 - theta ), 5.0 );
      	vec3 scatter = max( 0.0, dot( surfaceNormal, eyeDirection ) ) * waterColor;
      	vec3 albedo = mix( ( sunColor * diffuseLight * 0.3 + scatter ), ( vec3( 0.1 ) + reflectionSample * 0.9 + reflectionSample * specularLight ), reflectance);
      	vec3 outgoingLight = albedo;
      	gl_FragColor = vec4( outgoingLight, 1 );
      }
    `
  };

  const material = new THREE.ShaderMaterial({
    fragmentShader: mirrorShader.fragmentShader,
    vertexShader: mirrorShader.vertexShader,
    uniforms: THREE.UniformsUtils.clone(mirrorShader.uniforms),
    transparent: true,
    lights: true,
    side: side,
    fog: fog
  });

  material.uniforms.mirrorSampler.value = mirrorCamera.renderTarget.texture;
  material.uniforms.time.value = time;
  material.uniforms.normalSampler.value = normalSampler;
  material.uniforms.sunColor.value = sunColor;
  material.uniforms.waterColor.value = waterColor;
  material.uniforms.sunDirection.value = sunDirection;
  material.uniforms.distortionScale.value = distortionScale;

  material.uniforms.eye.value = eye;

  scope.material = material;
  scope.mirrorCamera = mirrorCamera;
};

THREE.Water.prototype = Object.create(THREE.Mesh.prototype);
THREE.Water.prototype.constructor = THREE.Water;

AFRAME.registerComponent("water", {
  schema: {
    speed: { type: "number", default: 0.1 },
    sunPosition: { type: "vec3", default: { x: -0.5, y: 0.5, z: 0 } }
  },
  init() {
    const waterGeometry = new THREE.PlaneBufferGeometry(800, 800);
    this.water = new THREE.Water(waterGeometry, {
      waterNormals: new THREE.TextureLoader().load(
        "assets/waternormals.jpg",
        function(texture) {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        }
      ),
      sunDirection: this.data.sunDirection,
      sunColor: 0xffffff,
      waterColor: 0x001e0f,
      distortionScale: 3.7,
      fog: false,
      layers: Layers.reflection
    });

    this.el.setObject3D("water", this.water);
  },

  update() {
    if (this.rendered) {
      return;
    }

    this.rendered = true;

    const renderer = this.el.sceneEl.renderer;
    const scene = this.el.sceneEl.object3D;
    console.log(renderer, scene);
    this.water.visible = false;
    this.water.mirrorCamera.update(renderer, scene);
    this.water.visible = true;

    window.mirrorCamera = this.water.mirrorCamera;
  },

  tick(time) {
    this.water.material.uniforms.time.value = time / 1000 * this.data.speed;
  },

  remove() {
    this.el.removeObject3D("water");
  }
});
