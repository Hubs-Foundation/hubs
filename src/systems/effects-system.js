// Adapted from https://gist.github.com/donmccurdy/31560945d5723737e6c656a2974ab628

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { BloomPass } from 'three/examples/jsm/postprocessing/BloomPass.js';
import { GlitchPass } from 'three/examples/jsm/postprocessing/GlitchPass.js';

export class EffectsSystem {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;
    this.init();
  }

  init() {
    const sceneEl = this.sceneEl;
    if (!sceneEl.hasLoaded) {
      console.log(sceneEl);
      sceneEl.addEventListener('loaded', this.init.bind(this));
      return;
    }

    const scene = sceneEl.object3D;
    const renderer = sceneEl.renderer;
    const camera = sceneEl.camera;

    const composer = new EffectComposer(renderer);
    const pass1 = new RenderPass(scene, camera);
    const pass2 = new BloomPass(2, 25, 1, 256);
    const pass3 = new GlitchPass();

    pass3.renderToScreen = true;

    composer.addPass(pass1);
    //composer.addPass(pass2);
    composer.addPass(pass3);

    this.composer = composer;
    this.t = 0;
    this.dt = 0;

    this.bind();
  }

  tick(t, dt) {
    this.t = t;
    this.dt = dt;
  }

  /**
  * Binds the EffectComposer to the A-Frame render loop.
  * (This is the hacky bit.)
  */
  bind () {
    const renderer = this.sceneEl.renderer;
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
}
