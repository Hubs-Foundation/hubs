// Adapted from https://gist.github.com/donmccurdy/31560945d5723737e6c656a2974ab628

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { CustomShader } from './effects/CustomShader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { Vector2 } from 'three';

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
    var passes = [
      new RenderPass(scene, camera),
      // UnrealBloomPass(resolution, strength, radius, threshold)
      new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 4.4, 0.85),
      //new ShaderPass(CustomShader, 'tDiffuse'),
    ];
    console.log(CustomShader);
    passes.slice(-1).renderToScreen = true;

    passes.forEach(pass => composer.addPass(pass))

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
