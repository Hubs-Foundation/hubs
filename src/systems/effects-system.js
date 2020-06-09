// Used for screen-space effect shaders
// and also handles updating uniforms (time, resolution) for all shaders

// Adapted from https://gist.github.com/donmccurdy/31560945d5723737e6c656a2974ab628

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { NegativeScreenShader } from '../shaders/NegativeScreenShader.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';
import { AdaptiveToneMappingPass } from 'three/examples/jsm/postprocessing/AdaptiveToneMappingPass.js';
import { Vector2, NoToneMapping } from 'three';


export class EffectsSystem {
  constructor(sceneEl) {
    this.sceneEl = sceneEl;
    this.init();
  }

  init() {
    const sceneEl = this.sceneEl;
    if (!sceneEl.hasLoaded) {
      sceneEl.addEventListener('loaded', this.init.bind(this));
      return;
    }

    const scene = sceneEl.object3D;
    const renderer = sceneEl.renderer;
    renderer.toneMapping = NoToneMapping;
    const camera = sceneEl.camera;

    var targetParams = {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      stencilBuffer: false
    };

    var renderTarget = new THREE.WebGLRenderTarget(1024, 1024, targetParams );
    renderTarget.texture.name = 'EffectComposer.rt1';
    const composer = new EffectComposer(renderer, renderTarget);

    var passes = [
      new RenderPass(scene, camera),
      // UnrealBloomPass(resolution, strength, radius, threshold)
      new UnrealBloomPass(new THREE.Vector2(1024, 1024), 1.6, 3.0, 0.9),
      new AdaptiveToneMappingPass(false, 1024),
      new ShaderPass(GammaCorrectionShader),
      //new ShaderPass(NegativeScreenShader, 'tDiffuse'),
    ];
    passes.slice(-1).renderToScreen = true;

    passes.forEach(pass => composer.addPass(pass))

    this.composer = composer;
    this.t = 0;
    this.dt = 0;

    this.shaders = [];

    this.bind();

    window.addEventListener('resize', this.onWindowResize.bind(this), false );
  }

  onWindowResize( event ) {
    this.shaders.forEach(shader => {
      //console.log(shader)
      shader.uniforms.resolution.value.x = window.innerWidth;
      shader.uniforms.resolution.value.y = window.innerHeight;
    })
  }

  tick(t, dt) {
    this.t = t;
    this.dt = dt;

    // update shaders
    this.shaders.forEach(shader => {
      //console.log(shader)
      shader.uniforms.time.value = t;  
    })
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

  registerShader(shader) {
    shader.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
    
    this.shaders.push(shader)
  }
}
