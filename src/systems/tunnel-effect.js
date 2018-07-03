import "./shaderlib/EffectComposer";
import "./shaderlib/RenderPass";
import "./shaderlib/ShaderPass";
import "./shaderlib/MaskPass";
import "./shaderlib/CopyShader";
import "./shaderlib/VignetteShader";

AFRAME.registerSystem ('tunneleffect', {
  schema: {
    checkThresholdMs: { type: 'number', default: 500 },
    vignetteFadingMs: { type: 'number', default: 1200},
    movingEvent: { type: 'string', default: 'move' },
    radius: { type: 'number', default: 0.9, min: 0.5},
    softness: { type: 'number', default: 0.1, min: 0.0},
    opacity: { type: 'number', default: 0.9, min: 0.0}
  },

  init: function () {
    console.log('init tunneleffect');
    const data = this.data;
    this.scene = this.el;
    this.isMoving = false;
    this.dt = 0;
    this.t = 0;
    this.thresholdMs = data.checkThresholdMs;
    this.fadingMs = data.vignetteFadingMs;
    this.initMs = Date.now();
    this.radius = data.radius;
    this.minRadius = 0.5;
    this.softness = data.softness;
    this.opacity = data.opacity;
    this.movingStartTimeMs = 0;
    this.lastMovingTimeMs = 0;
    // original render function of the renderer
    this.originalRenderFunc = this.scene.renderer.render;
    // add event listener for moving event
    this.enableTunnelEffect = this.enableTunnelEffect.bind(this);
    this.scene.addEventListener(data.movingEvent, this.enableTunnelEffect);
  },

  update: function () {
    // todo
  },

  play: function () {

  },

  pause: function () {
    this.scene.removeEventListener(data.movingEvent, this.enableTunnelEffect);
  },

  tick: function (time, deltaTime) {
    if (this.isMoving) {
      if (time - this.movingStartTimeMs < this.fadingMs) {
        console.log('fading');
        const progress = (time - this.movingStartTimeMs) / this.fadingMs;
        const r = this.radius - (this.radius - this.minRadius) * progress;
        this._updateVignettePass(r, this.softness, this.opacity);
      } else {
        if (time - this.lastMovingTimeMs > this.thresholdMs) {
          console.log('idle');
          this.isMoving = false;
          this.scene.renderer.render = this.originalRenderFunc;
          this.lastMovingTimeMs = time;
          this.movingStartTimeMs = time;
        }
      }
    } else {
      if (this.scene.renderer.render !== this.originalRenderFunc) {
        this.scene.renderer.render = this.originalRenderFunc;
      }
    }
  },

  _updateComposer: function () {
    if (!this.renderer) {
      this.renderer = this.scene.renderer;
      this.camera = this.scene.camera;
    }
    if (!this.composer) {
      this.composer = new THREE.EffectComposer(this.renderer);
    }
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
    this.vignettePass['resolution'] = new THREE.Uniform(new THREE.Vector2(width * pixelRatio, height * pixelRatio));
    if (!this.vignettePass.renderToScreen) {
      this.vignettePass.renderToScreen = true;
    }
  },

  bindRenderFunc: function () {
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
  },

  enableTunnelEffect: function () {
    if (this.isMoving) {
      this.lastMovingTimeMs = Date.now() - this.initMs;
      return;
    }
    this.isMoving = true;
    this.movingStartTimeMs = Date.now() - this.initMs;
    this._updateComposer();
    this.bindRenderFunc();
  }
});
