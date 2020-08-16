// Used for screen-space effect shaders
// and also handles updating uniforms (time, resolution) for surface shaders
// + ShaderFrog integration

// Adapted from https://gist.github.com/donmccurdy/31560945d5723737e6c656a2974ab628

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { NegativeScreenShader } from '../shaders/NegativeScreenShader.js';
import { UnrealBloomPass } from '../shaders/FixedUnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from '../shaders/GammaCorrectionShader.js';
import { AdjustColorShader } from '../shaders/AdjustColorShader.js';
import { AdaptiveToneMappingPass } from 'three/examples/jsm/postprocessing/AdaptiveToneMappingPass.js';
import { Vector2, NoToneMapping } from 'three';

import { qsGet } from "../utils/qs_truthy";

import ShaderFrogRuntime from '../ShaderRuntime.js';

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
    const camera = sceneEl.camera;

    // var targetParams = {
    //   minFilter: THREE.NearestFilter,
    //   magFilter: THREE.LinearMipmapLinearFilter,
    //   format: THREE.RGBAFormat,
    //   type: THREE.FloatType,
    //   stencil: false
    // };
    // var renderTarget = new THREE.WebGLRenderTarget(1024, 1024, targetParams);
    // renderTarget.texture.name = 'EffectComposer.rt1';
    // const composer = new EffectComposer(renderer, renderTarget);

    const composer = new EffectComposer(renderer);

    var passes = [
      new RenderPass(scene, camera),
      new ShaderPass(AdjustColorShader(0.0, 1.1, 1.2)), // brightness, contrast, saturation
      // UnrealBloomPass(resolution, strength, radius, threshold)
      new UnrealBloomPass(new THREE.Vector2(128, 128), 1.3, 1.0, 0.8),

      // new ShaderPass(GammaCorrectionShader(1.2)),

      // new ShaderPass(NegativeScreenShader, 'tDiffuse'),
    ];
    passes.slice(-1)[0].renderToScreen = true;

    passes.forEach(pass => composer.addPass(pass))

    this.composer = composer;
    this.t = 0;
    this.dt = 0;

    this.shaders = [];

    // this.bind(); // this is too early, messes up the colors for some reason

    window.addEventListener('resize', this.onWindowResize.bind(this), false );

    // Setup ShaderFrog
    this.shaderFrog = new ShaderFrogRuntime();
    this.shaderFrog.registerCamera( camera );
  }

  onWindowResize( event ) {
    this.shaders.forEach(shader => {
      shader.uniforms.resolution.value.x = window.innerWidth;
      shader.uniforms.resolution.value.y = window.innerHeight;
    })
  }

  tick(t, dt) {
    this.t = t;
    this.dt = dt;

    // update shaders
    this.shaders.forEach(shader => {
      shader.uniforms.time.value = t;  
    })

    this.shaderFrog.updateShaders(t/1000.0);
  }

  /**
  * Binds the EffectComposer to the A-Frame render loop.
  * (This is the hacky bit.)
  */
  bind () {
    if (!this.bound) {
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
      this.bound=true;
    }
  }

  registerShader(shader) {
    if (shader.uniforms.resolution) {
      shader.uniforms.resolution.value = new THREE.Vector2(window.innerWidth, window.innerHeight);
    }
    this.shaders.push(shader)
  }

  registerShaderFrogShader(shader) {
    var material;
    const shaderFrog = this.shaderFrog;
    shaderFrog.addShader(shader, function( shaderData ) {
      // Get the Three.js material you can assign to your objects
      material = shaderFrog.get(shaderData.name);
    });
    return material;
  }
}
