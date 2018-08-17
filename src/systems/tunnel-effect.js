import "../utils/postprocessing/EffectComposer";
import "../utils/postprocessing/RenderPass";
import "../utils/postprocessing/ShaderPass";
import "../utils/postprocessing/MaskPass";
import "../utils/shaders/CopyShader";
import "../utils/shaders/VignetteShader";
import qsTruthy from "../utils/qs_truthy";

const isDisabled = qsTruthy("disableTunnel");
const CLAMP_SPEED = 0.01;
const CLAMP_RADIUS = 0.001;
const CLAMP_SOFTNESS = 0.001;
const FADE_TIMEOUT_MS = 300;
const TARGET_RADIUS = 10.0;
const TARGET_SOFTNESS = 0.0;

AFRAME.registerSystem("tunneleffect", {
  schema: {
    targetComponent: { type: "string", default: "character-controller" },
    radius: { type: "number", default: 1.0, min: 0.25 },
    minRadius: { type: "number", default: 0.25, min: 0.1 },
    maxSpeed: { type: "number", default: 0.7, min: 0.1 },
    softness: { type: "number", default: 0.1, min: 0.0 },
    opacity: { type: "number", default: 1, min: 0.0 }
  },

  init: function() {
    this.scene = this.el;
    this.isMoving = false;
    this.isVR = false;
    this.dt = 0;
    this.isPostProcessingReady = false;
    this.characterEl = document.querySelector(`a-entity[${this.data.targetComponent}]`);
    if (this.characterEl) {
      this._initPostProcessing = this._initPostProcessing.bind(this);
      this.characterEl.addEventListener("componentinitialized", this._initPostProcessing);
    } else {
      console.warn("Could not find target component.");
    }
    this._enterVR = this._enterVR.bind(this);
    this._exitVR = this._exitVR.bind(this);
    this.scene.addEventListener("enter-vr", this._enterVR);
    this.scene.addEventListener("exit-vr", this._exitVR);
  },

  pause: function() {
    if (!this.characterEl) {
      return;
    }
    this.characterEl.removeEventListener("componentinitialized", this._initPostProcessing);
    this.scene.removeEventListener("enter-vr", this._enterVR);
    this.scene.removeEventListener("exit-vr", this._exitVR);
  },

  play: function() {
    this.scene.addEventListener("enter-vr", this._enterVR);
    this.scene.addEventListener("exit-vr", this._exitVR);
  },

  tick: function(t, dt) {
    this.dt = dt;

    if (isDisabled || !this.isPostProcessingReady || !this.isVR) {
      return;
    }

    const characterSpeed = this.characterComponent.velocity.length();
    if (characterSpeed < CLAMP_SPEED) {
      // the character stops, so we use the aframe default render func
      const r = this.vignettePass.uniforms["radius"].value;
      const softness = this.vignettePass.uniforms["softness"].value;
      if (
        this.isMoving &&
        Math.abs(r - TARGET_RADIUS) > CLAMP_RADIUS &&
        Math.abs(softness - TARGET_SOFTNESS) > CLAMP_SOFTNESS
      ) {
        if (!this.deltaR && !this.deltaS) {
          this.deltaR = TARGET_RADIUS - r;
          this.deltaS = softness - TARGET_SOFTNESS;
        }
        const ratio = this.dt / FADE_TIMEOUT_MS;
        this._updateVignettePass(r + this.deltaR * ratio, softness - this.deltaS * ratio, this.data.opacity);
      } else {
        this._exitTunnel();
      }
      return;
    }

    if (!this.isMoving) {
      this.isMoving = true;
      this._bindRenderFunc();
    }
    const { radius, minRadius, maxSpeed, softness, opacity } = this.data;
    const r = (radius - minRadius) * (maxSpeed - characterSpeed) + minRadius;
    this._updateVignettePass(r, softness, opacity);
  },

  _exitTunnel: function() {
    this.scene.renderer.render = this.originalRenderFunc;
    this.isMoving = false;
  },

  _initPostProcessing: function(event) {
    if (event.detail.name === this.data.targetComponent) {
      this.characterEl.removeEventListener("componentinitialized", this._initPostProcessing);
      this.characterComponent = this.characterEl.components[this.data.targetComponent];
      this._initComposer();
    }
  },

  _enterVR: function() {
    this.isVR = true;
  },

  _exitVR: function() {
    this._exitTunnel();
    this.isVR = false;
  },

  _initComposer: function() {
    this.renderer = this.scene.renderer;
    this.camera = this.scene.camera;
    this.originalRenderFunc = this.scene.renderer.render;
    this.isDigest = false;
    const render = this.scene.renderer.render;
    const system = this;
    this.postProcessingRenderFunc = function() {
      if (system.isDigest) {
        render.apply(this, arguments);
      } else {
        system.isDigest = true;
        system.composer.render(system.dt);
        system.isDigest = false;
      }
    };
    this.composer = new THREE.EffectComposer(this.renderer);
    this.composer.resize();
    this.scenePass = new THREE.RenderPass(this.scene.object3D, this.camera);
    this.vignettePass = new THREE.ShaderPass(THREE.VignetteShader);
    this._updateVignettePass(this.data.radius, this.data.softness, this.data.opacity);
    this.composer.addPass(this.scenePass);
    this.composer.addPass(this.vignettePass);
    this.isPostProcessingReady = true;
  },

  _updateVignettePass: function(radius, softness, opacity) {
    const { width, height } = this.renderer.getSize();
    const pixelRatio = this.renderer.getPixelRatio();
    this.vignettePass.uniforms["radius"].value = radius;
    this.vignettePass.uniforms["softness"].value = softness;
    this.vignettePass.uniforms["opacity"].value = opacity;
    this.vignettePass["resolution"] = new THREE.Uniform(new THREE.Vector2(width * pixelRatio, height * pixelRatio));
    if (!this.vignettePass.renderToScreen) {
      this.vignettePass.renderToScreen = true;
    }
  },

  /**
   * use the render func of the effect composer when we need the postprocessing
   */
  _bindRenderFunc: function() {
    this.scene.renderer.render = this.postProcessingRenderFunc;
  }
});
