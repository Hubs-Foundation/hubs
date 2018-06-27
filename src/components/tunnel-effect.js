import "./shaderlib/EffectComposer";
import "./shaderlib/RenderPass";
import "./shaderlib/ShaderPass";
import "./shaderlib/MaskPass";
import "./shaderlib/CopyShader";
import "./shaderlib/VignetteShader";

AFRAME.registerComponent('tunnel-effect', {
  init: function () {
    console.log('init');
    this.obj = null;
    this.vrStarted = false;
    var self = this;
    var initVars = this._initVars.bind(self);
    this.el.addEventListener('renderstart', initVars);
  },

  _initVars: function () {
    console.log('vars');
    this.obj = this.el;
    this.scene = this.obj.object3D;
    this.camera = this.obj.camera;
    this.renderer = this.obj.renderer;
    this.composer = new THREE.EffectComposer(this.renderer);
    this.pass = new THREE.RenderPass(this.scene, this.camera);
    this.composer.addPass(this.pass);
    this._vignetteEffect();
    this.vrStarted = true;
    this.t = 0;
    this.dt = 0;
    this.bind();
  },

  _vignetteEffect: function () {
    this.shaderVignette = THREE.VignetteShader;
	  this.effectVignette = new THREE.ShaderPass( this.shaderVignette );
    this.effectVignette.renderToScreen = true;
    this.composer.addPass(this.effectVignette);
  },

  tick: function (t, dt) {
    // console.log('system ticks');
    this.t = t;
    this.dt = dt;
  },

  tock: function (t, dt) {
  },

  renderPass: function (t) {
    // console.log(this.composer);
    this.composer.render(t);
  },

  registerComponent: function () {
  },

  bind: function () {
    const renderer = this.obj.renderer;
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


// AFRAME.registerComponent('post-effect', {
//   init: function () {
//   },

//   tick: function () {
//     console.log('component ticks');
//     this.system.renderPass();
//   }
// });
