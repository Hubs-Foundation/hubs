import {
  EffectComposer,
  EffectPass,
  RenderPass,
  NormalPass,
  SMAAEffect,
  SSAOEffect,
  BloomEffect
} from "postprocessing";

export default class RenderManager {
  constructor(scene, rendererConfig, rendererAttr, shaders) {
    this.scene = scene;

    let enableMultiview = false;

    if (rendererAttr) {
      if (rendererAttr.webgl2 && rendererAttr.webgl2 === "true") {
        const context = scene.canvas.getContext("webgl2", {
          premultipliedAlpha: true,
          preserveDrawingBuffer: false,
          powerPreference: "high-performance",
          xrCompatible: true
        });

        if (context) {
          console.log("Using WebGL 2.0 context.");
          rendererConfig.context = context;

          const multiviewSupported =
            !!context.getExtension("WEBGL_multiview") || !!context.getExtension("OVR_multiview");
          if (enableMultiview && !multiviewSupported) {
            console.warn("Multiview enabled but WEBGL/OVR_multiview extension browser support not available");
            enableMultiview = false;
          }

          const versionRegex = /^\s*#version\s+300\s+es\s*\n/;

          for (const shaderName in shaders) {
            const shader = shaders[shaderName];

            const shaderProto = shader.Shader.prototype;

            if (!shaderProto.raw) {
              continue;
            }

            let vertexShader = shaderProto.vertexShader;
            let fragmentShader = shaderProto.fragmentShader;

            let isGLSL3ShaderMaterial = false;

            if (vertexShader.match(versionRegex) !== null && fragmentShader.match(versionRegex) !== null) {
              isGLSL3ShaderMaterial = true;

              vertexShader = vertexShader.replace(versionRegex, "");
              fragmentShader = fragmentShader.replace(versionRegex, "");
            }

            // GLSL 3.0 conversion
            const prefixVertex =
              [
                "#version 300 es\n",
                "#define attribute in",
                "#define varying out",
                "#define texture2D texture",
                enableMultiview ? "#define AFRAME_enable_multiview" : ""
              ].join("\n") + "\n";

            const prefixFragment =
              [
                "#version 300 es\n",
                "#define varying in",
                isGLSL3ShaderMaterial ? "" : "out highp vec4 pc_fragColor;",
                isGLSL3ShaderMaterial ? "" : "#define gl_FragColor pc_fragColor",
                "#define gl_FragDepthEXT gl_FragDepth",
                "#define texture2D texture",
                "#define textureCube texture",
                "#define texture2DProj textureProj",
                "#define texture2DLodEXT textureLod",
                "#define texture2DProjLodEXT textureProjLod",
                "#define textureCubeLodEXT textureLod",
                "#define texture2DGradEXT textureGrad",
                "#define texture2DProjGradEXT textureProjGrad",
                "#define textureCubeGradEXT textureGrad"
              ].join("\n") + "\n";

            shaderProto.vertexShader = prefixVertex + vertexShader;
            shaderProto.fragmentShader = prefixFragment + fragmentShader;
          }
        } else {
          console.warn("No WebGL 2.0 context available. Falling back to WebGL 1.0");
          if (enableMultiview) {
            console.warn("Multiview enabled but requires a WebGL2 context");
            enableMultiview = false;
          }
        }
      }
    }

    this.renderer = new THREE.WebGLRenderer({
      ...rendererConfig,
      logarithmicDepthBuffer: true,
      powerPreference: "high-performance"
    });

    this.renderer.outputEncoding = THREE.sRGBEncoding;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.shadowMap.autoUpdate = false;
    this.renderer.shadowMap.needsUpdate = true;
    this.renderer.shadowMap.enabled = true;

    this.renderer.setPixelRatio(window.devicePixelRatio);

    this.composer = new EffectComposer(this.renderer);
    this.passesInitialized = false;

    const searchImage = new Image();
    const areaImage = new Image();

    searchImage.addEventListener("load", () => {
      this.searchImage = searchImage;
    });

    areaImage.addEventListener("load", () => {
      this.areaImage = areaImage;
    });

    searchImage.src = SMAAEffect.searchImageDataURL;
    areaImage.src = SMAAEffect.areaImageDataURL;
  }

  setSize(width, height, updateStyle) {
    this.composer.setSize(width, height, updateStyle);
  }

  render() {
    const dt = this.scene.delta / 1000;

    if (!this.passesInitialized && this.scene.camera && this.searchImage && this.areaImage) {
      const renderPass = new RenderPass(this.scene.object3D, this.scene.camera);
      this.composer.addPass(renderPass);

      const normalPass = new NormalPass(this.scene.object3D, this.scene.camera);
      this.composer.addPass(normalPass);

      const ssaoEffect = new SSAOEffect(this.scene.camera, normalPass.renderTarget.texture, {
        samples: 32,
        rings: 5,
        bias: 0.5,
        scale: 0.8
      });

      const bloomEffect = new BloomEffect(this.scene.object3D, this.scene.camera, {
        luminanceThreshold: 1
      });

      const smaaEffect = new SMAAEffect(this.searchImage, this.areaImage);

      const effectPass = new EffectPass(this.scene.camera, smaaEffect, ssaoEffect, bloomEffect);
      effectPass.renderToScreen = true;

      this.composer.addPass(effectPass);

      this.passesInitialized = true;
    }

    this.composer.render(dt);
  }
}
