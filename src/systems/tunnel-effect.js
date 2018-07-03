import "./shaderlib/EffectComposer";
import "./shaderlib/RenderPass";
import "./shaderlib/ShaderPass";
import "./shaderlib/MaskPass";
import "./shaderlib/CopyShader";
import "./shaderlib/VignetteShader";

AFRAME.registerSystem ('tunneleffect', {
  schema: {
    checkThresholdMs: { type: 'number', default: 200 },
    vignetteFadingMs: { type: 'number', default: 800 },
    movingEvent: { type: 'string', default: 'move' },
    radius: { type: 'number', default: 0.9, min: 0.5 },
    minRadius: { type: 'number', default: 0.5, min: 0.1 },
    softness: { type: 'number', default: 0.1, min: 0.0 },
    opacity: { type: 'number', default: 0.9, min: 0.0 }
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
    this.minRadius = 0.65;
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
    if (!this.isMoving) { return; }
    if (time - this.movingStartTimeMs < this.fadingMs) {
      this._fadeInEffect(time, this.movingStartTimeMs, this.fadingMs);
    } else {
      if (time - this.lastMovingTimeMs < this.thresholdMs) { return; }
      if (time - this.lastMovingTimeMs < this.fadingMs / 1.5) {
        this._fadeOutEffect(time, this.lastMovingTimeMs, this.fadingMs / 1.5);
      } else {
        this.isMoving = false;
        this.scene.renderer.render = this.originalRenderFunc;
        this.lastMovingTimeMs = time;
        this.movingStartTimeMs = time;
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

  _fadingEffect: function (currentTime, baseTime, fadingDuration, originRadius, targetRadius) {
    const progress = (currentTime - baseTime) / fadingDuration;
    const deltaR = (originRadius - targetRadius) * progress;
    const r = this.radius - deltaR;
    this._updateVignettePass(r, this.softness, this.opacity);
  },

  _fadeOutEffect: function (currentTime, baseTime, fadingDuration) {
    this._fadingEffect(currentTime, baseTime, fadingDuration, this.minRadius, this.radius);
  },

  _fadeInEffect: function (currentTime, baseTime, fadingDuration) {
    this._fadingEffect(currentTime, baseTime, fadingDuration, this.radius, this.minRadius);
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
