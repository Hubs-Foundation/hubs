import type { AScene } from "aframe";
import { AAModes } from "./constants";
import {
  BlendFunction,
  BloomEffect,
  CopyPass,
  EffectComposer,
  EffectPass,
  LambdaPass,
  RenderPass,
  SMAAEffect,
  ToneMappingEffect,
  ToneMappingMode
} from "postprocessing";
import { Camera, HalfFloatType, Mesh, OrthographicCamera, Scene, WebGLRenderer } from "three";
import { Layers } from "./camera-layers";
import { createImageMesh } from "./utils/create-image-mesh";
import Store from "./storage/store";
import qsTruthy from "./utils/qs_truthy";

export function createEffectsComposer(
  canvas: HTMLCanvasElement,
  renderer: WebGLRenderer,
  camera: Camera,
  scene: Scene,
  sceneEl: AScene,
  store: Store
) {
  const composer = new EffectComposer(renderer, {
    frameBufferType: HalfFloatType
  });
  composer.autoRenderToScreen = false;
  composer.setSize(canvas.width, canvas.height, false);

  const renderScenePass = new RenderPass(scene, camera);
  renderScenePass.clear = true;

  const renderUIPass = new RenderPass(scene, camera);
  renderUIPass.clear = false;
  renderUIPass.ignoreBackground = true;

  const copyToScreenPass = new CopyPass();
  copyToScreenPass.renderToScreen = true;

  const copyBuffersPass = new EffectPass(camera);
  copyBuffersPass.enabled = false;

  // TODO support other tonemapping options with HDR pipeline
  const tonemappingEffect = new ToneMappingEffect({
    mode: ToneMappingMode.ACES_FILMIC
  });

  let bloomAndTonemapPass: EffectPass | undefined;
  if (store.state.preferences.enableBloom) {
    const bloom = new BloomEffect({ mipmapBlur: true });
    bloomAndTonemapPass = new EffectPass(camera, bloom, tonemappingEffect);
  }

  let tonemapOnlyPass = new EffectPass(camera, tonemappingEffect);

  let aaPass = new EffectPass(camera, new SMAAEffect());
  aaPass.renderToScreen = true;

  let mask: number;
  const disableUILayers = new LambdaPass(function () {
    mask = camera.layers.mask;
    camera.layers.disable(Layers.CAMERA_LAYER_UI);
    camera.layers.disable(Layers.CAMERA_LAYER_FX_MASK);
  });
  const enableUILayers = new LambdaPass(() => {
    camera.layers.set(Layers.CAMERA_LAYER_UI);
    camera.layers.enable(Layers.CAMERA_LAYER_FX_MASK);
    copyBuffersPass.enabled = bloomAndTonemapPass?.enabled || tonemapOnlyPass.enabled;
  });
  const resetLayers = new LambdaPass(() => {
    camera.layers.mask = mask;
  });

  // One of these will be enabled by environment-system depending on scene settings and prefs
  tonemapOnlyPass.enabled = false;
  if (bloomAndTonemapPass) bloomAndTonemapPass.enabled = false;

  composer.addPass(disableUILayers);
  composer.addPass(renderScenePass);
  if (bloomAndTonemapPass) composer.addPass(bloomAndTonemapPass);
  composer.addPass(tonemapOnlyPass);
  composer.addPass(enableUILayers);
  composer.addPass(copyBuffersPass);
  composer.addPass(renderUIPass);
  composer.addPass(resetLayers);
  composer.addPass(copyToScreenPass);
  composer.addPass(aaPass);

  function applyAAMode(mode: AAModes) {
    aaPass.enabled = mode === AAModes.SMAA;
    switch (mode) {
      case AAModes.NONE:
      case AAModes.SMAA:
        composer.multisampling = 0;
        break;
      case AAModes.MSAA_2X:
        composer.multisampling = 2;
        break;
      case AAModes.MSAA_4X:
        composer.multisampling = 4;
        break;
      case AAModes.MSAA_8X:
        composer.multisampling = 8;
        break;
    }
    console.log(aaPass.enabled, composer.multisampling);

    // either aaPass or copyToScreenPass will handle the final copy to the canvas framebuffer
    copyToScreenPass.enabled = !aaPass.enabled;
  }

  const aaMode = store.state.preferences.aaMode;
  applyAAMode(aaMode);

  // TODO this is a bit of a hack using an empty effect pass to copy buffers so that renderUIPass uses same depth buffer as renderScenePass
  // There should be a cleaner way to just bind the depth buffer for the renderUIPass correctly.
  (copyBuffersPass as any).skipRendering = false;
  copyBuffersPass.needsSwap = true;

  let debugCamera: OrthographicCamera;
  let debugMeshes: Mesh[];
  let updateDebugMeshes: () => void;
  if (qsTruthy("envSettingsDebug") && bloomAndTonemapPass) {
    const bloom = (bloomAndTonemapPass as any).effects[0] as BloomEffect;

    const debugScene = new Scene();
    debugCamera = new OrthographicCamera(0, canvas.width, 0, canvas.height, 0.1, 100);
    debugCamera.layers.enable(Layers.CAMERA_LAYER_FX_MASK);
    debugCamera.matrixAutoUpdate = true;
    debugCamera.position.z = 5;

    debugMeshes = [bloom.luminancePass.texture, bloom.texture].map(function (t) {
      const imageMesh = createImageMesh(t, 1);
      imageMesh.material.depthTest = false;
      debugScene.add(imageMesh);
      return imageMesh;
    });

    updateDebugMeshes = () => {
      let y = 10;
      for (const imageMesh of debugMeshes) {
        const height = 200;
        const width = height * (canvas.width / canvas.height);
        imageMesh.scale.x = width;
        imageMesh.scale.y = height;
        imageMesh.position.y = y + height / 2;
        imageMesh.position.x = 10 + width / 2;
        imageMesh.matrixNeedsUpdate = true;
        y += height + 10;
      }
    };
    updateDebugMeshes();

    const debugPass = new RenderPass(debugScene, debugCamera);
    debugPass.ignoreBackground = true;
    debugPass.clear = false;
    debugPass.renderToScreen = true;
    debugPass.enabled = false;

    composer.addPass(debugPass);

    setTimeout(function () {
      const envSystem = sceneEl.systems["hubs-systems"].environmentSystem;
      const gui = envSystem.debugGui.addFolder("Post Effects Debug");
      {
        const f = gui.addFolder("Bloom");
        f.add(bloom.blendMode, "blendFunction", BlendFunction);
        f.add(bloom.blendMode.opacity, "value", 0, 1).name("Opacity");
      }
      gui.add({ aaMode }, "aaMode", AAModes).onChange(applyAAMode);
      gui.add(debugPass, "enabled").name("debug");
    }, 0);
  }

  (sceneEl as any).addEventListener("rendererresize", function ({ detail }: { detail: DOMRectReadOnly }) {
    composer.setSize(detail.width, detail.height, false);
    if (debugCamera) {
      debugCamera.right = detail.width;
      debugCamera.bottom = detail.height;
      debugCamera.updateProjectionMatrix();
      updateDebugMeshes();
    }
  });

  return {
    composer,
    bloomAndTonemapPass,
    tonemapOnlyPass
  };
}
