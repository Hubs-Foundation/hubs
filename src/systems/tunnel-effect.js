import "../utils/postprocessing/EffectComposer";
import "../utils/postprocessing/RenderPass";
import "../utils/postprocessing/ShaderPass";
import "../utils/postprocessing/MaskPass";
import "../utils/shaders/CopyShader";
import "../utils/shaders/VignetteShader";

const STATIC = new THREE.Vector3(0, 0, 0);
const CLAMP_VELOCITY = 0.01;

AFRAME.registerSystem ('tunneleffect', {
  schema: {
    targetComponent: { type: 'string', default: 'character-controller'},
    movingEvent: { type: 'string', default: 'renderstart' },
    radius: { type: 'number', default: 0.45, min: 0.25 },
    minRadius: { type: 'number', default: 0.2, min: 0.1 },
    softness: { type: 'number', default: 0.1, min: 0.0 },
    opacity: { type: 'number', default: 1, min: 0.0 }
  },

  init: function () {
    const data = this.data;
    this.scene = this.el;
    this.isMoving = false;
    this.dt = 0;
    this.t = 0;
    this.radius = data.radius;
    this.minRadius = data.minRadius;
    this.softness = data.softness;
    this.opacity = data.opacity;
    this.characterVelocity = new THREE.Vector3(0, 0, 0);

    // add event listener for init composer
    this.characterEl = document.querySelector(`a-entity[${this.data.targetComponent}]`);
    if (this.characterEl) {
      this._initPostProcessing = this._initPostProcessing.bind(this);
      this.characterEl.addEventListener('componentinitialized', this._initPostProcessing);
    }
  },

  update: function () {
  },

  pause: function () {
    if (!this.characterEl) { return; }
    this.characterEl.removeEventListener('componentinitialized', this._initPostProcessing);
  },

  tick: function (time, deltaTime) {
    this.t = time;
    this.dt = deltaTime;

    if (!this._isPostProcessingReady()) { return; }

    this.characterVelocity = this.characterComponent.velocity;
    if (this.characterVelocity.distanceTo(STATIC) < CLAMP_VELOCITY) {
      this.scene.renderer.render = this.originalRenderFunc;
      this.isMoving = false;
      return;
    }

    if (!this.isMoving) {
      this.isMoving = true;
      this._bindRenderFunc();
    }
    const deltaR = (this.radius - this.minRadius) * this.characterVelocity.distanceTo(STATIC);
    const r = this.radius - deltaR;
    this._updateVignettePass(r, this.softness, this.opacity);
  },

  _initPostProcessing: function (event) {
    if (event.detail.name === this.data.targetComponent) {
      this.characterComponent = this.characterEl.components[this.data.targetComponent];
      this.characterVelocity = this.characterComponent.velocity;
      this._initComposer();
    }
  },

  _isPostProcessingReady: function () {
    if (!this.characterComponent || !this.renderer || !this.camera || !this.composer)
      return false;
    return true;
  },

  _initComposer: function () {
    if (!this.renderer) {
      this.renderer = this.scene.renderer;
      this.camera = this.scene.camera;
      this.originalRenderFunc = this.scene.renderer.render;
    }
    if (!this.composer) {
      this.composer = new THREE.EffectComposer(this.renderer);
    }
    this.composer.resize();
    if (!this.scenePass) {
      this.scenePass = new THREE.RenderPass(this.scene.object3D, this.camera);
    }
    if (!this.vignettePass) {
      this._updateVignettePass(this.radius, this.softness, this.opacity);
    }
    this.composer.addPass(this.scenePass);
    this.composer.addPass(this.vignettePass);
  },

  _updateVignettePass: function (radius, softness, opacity) {
    if (!this.vignettePass) {
      this.vignettePass = new THREE.ShaderPass(THREE.VignetteShader);
    }
    const { width, height } = this.renderer.getSize();
    const pixelRatio = this.renderer.getPixelRatio();
    this.vignettePass.uniforms['radius'].value = radius;
    this.vignettePass.uniforms['softness'].value = softness;
    this.vignettePass.uniforms['opacity'].value = opacity;
    this.vignettePass['resolution'] = new THREE.Uniform(new THREE.Vector2(width * pixelRatio , height * pixelRatio));
    if (!this.vignettePass.renderToScreen) {
      this.vignettePass.renderToScreen = true;
    }
  },

  _bindRenderFunc: function () {
    const renderer = this.scene.renderer;
    const render = renderer.render;
    const system = this;
    let isDigest = false;

    renderer.render = function () {
      if (isDigest) {
        render.apply(this, arguments);
      } else {
        isDigest = true;
        system.composer.render(system.dt);
        isDigest = false;
      }
    };
  }
});
