import "./shaderlib/EffectComposer";
import "./shaderlib/RenderPass";
import "./shaderlib/ShaderPass";
import "./shaderlib/MaskPass";
import "./shaderlib/CopyShader";
import "./shaderlib/VignetteShader";

AFRAME.registerComponent('tunneleffect', {
  schema: {
    checkThresholdMs: {type: 'number', default: 200},
    
  },
  init: function () {
    this.scene = this.el.sceneEl;
    this.image = document.querySelector('#tunnel-effect');
    this.isMoving = 0;
    this.image.setAttribute('visible', false);
    const openTunnelEffect = this._openTunnelEffect.bind(this);
    this.scene.addEventListener('move', openTunnelEffect);
    this.dt = 0;
    this.t = 0;
    this.threshold = 300;
  },

  _openTunnelEffect: function () {
    if (!this.isMoving) {
      this.image.setAttribute('visible', true);
      this.isMoving = true;
    }
    this.t = this.scene.time;
  },

  _closeTunnelEffect: function () {
    console.log('visible false');
  },

  tick: function (time, deltaTime) {
    if (this.isMoving && time - this.t > this.threshold) {
      this.isMoving = false;
      this.image.setAttribute('visible', false);
      this.t = time;
    }

  },

  play: function () {
    // this._closeTunnelEffect();

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
