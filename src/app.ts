import * as bitecs from "bitecs";
import { addEntity, createWorld, IWorld } from "bitecs";
import "./aframe-to-bit-components";
import { AEntity, Networked, Object3DTag, Owned } from "./bit-components";
import MediaSearchStore from "./storage/media-search-store";
import Store from "./storage/store";
import qsTruthy from "./utils/qs_truthy";

import type { AElement, AScene } from "aframe";
import HubChannel from "./utils/hub-channel";
import MediaDevicesManager from "./utils/media-devices-manager";
// @ts-ignore
import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";

import {
  Audio,
  AudioListener,
  BasicDepthPacking,
  BoxGeometry,
  Camera,
  CameraHelper,
  HalfFloatType,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  OrthographicCamera,
  PerspectiveCamera,
  PositionalAudio,
  RGBAFormat,
  Scene,
  sRGBEncoding,
  WebGLRenderer,
  WebGLRenderTarget
} from "three";
import { AudioSettings, SourceType } from "./components/audio-params";
import { DialogAdapter } from "./naf-dialog-adapter";
import { mainTick } from "./systems/hubs-systems";
import { waitForPreloads } from "./utils/preload";
import {
  BlendFunction,
  BloomEffect,
  ClearPass,
  CopyPass,
  DepthCopyPass,
  EffectComposer,
  EffectPass,
  LambdaPass,
  LuminancePass,
  OverrideMaterialManager,
  RenderPass,
  SelectiveBloomEffect,
  SMAAEffect,
  TextureEffect,
  ToneMappingEffect,
  ToneMappingMode
} from "postprocessing";
import { Layers } from "./components/layers";
import { createImageMesh } from "./utils/create-image-mesh";

declare global {
  interface Window {
    $B: typeof bitecs;
    $O: (eid: number) => Object3D | undefined;
    APP: App;
  }
  const APP: App;
}

export interface HubsWorld extends IWorld {
  scene: Scene;
  nameToComponent: {
    object3d: typeof Object3DTag;
    networked: typeof Networked;
    owned: typeof Owned;
    AEntity: typeof AEntity;
  };
  ignoredNids: Set<number>;
  deletedNids: Set<number>;
  nid2eid: Map<number, number>;
  eid2obj: Map<number, Object3D>;
  time: { delta: number; elapsed: number; tick: number };
}

window.$B = bitecs;

export class App {
  scene?: AScene;
  hubChannel?: HubChannel;
  mediaDevicesManager?: MediaDevicesManager;

  store = new Store();
  mediaSearchStore = new MediaSearchStore();

  audios = new Map<AElement | number, PositionalAudio | Audio>();
  sourceType = new Map<AElement | number, SourceType>();
  audioOverrides = new Map<AElement | number, AudioSettings>();
  zoneOverrides = new Map<AElement | number, AudioSettings>();
  gainMultipliers = new Map<AElement | number, number>();
  supplementaryAttenuation = new Map<AElement | number, number>();
  clippingState = new Set<AElement | number>();
  mutedState = new Set<AElement | number>();
  isAudioPaused = new Set<AElement | number>();
  audioDebugPanelOverrides = new Map<SourceType, AudioSettings>();
  sceneAudioDefaults = new Map<SourceType, AudioSettings>();

  world: HubsWorld = createWorld();

  str2sid: Map<string | null, number>;
  sid2str: Map<number, string | null>;
  nextSid = 1;

  audioListener: AudioListener;

  dialog = new DialogAdapter();

  RENDER_ORDER = {
    HUD_BACKGROUND: 1,
    HUD_ICONS: 2,
    CURSOR: 3
  };

  fx: {
    composer?: EffectComposer;
    bloomAndTonemapPass?: EffectPass;
    tonemapOnlyPass?: EffectPass;
  } = {};

  constructor() {
    // TODO: Create accessor / update methods for these maps / set
    this.world.eid2obj = new Map();

    this.world.nid2eid = new Map();
    this.world.deletedNids = new Set();
    this.world.ignoredNids = new Set();

    // used in aframe and networked aframe to avoid imports
    this.world.nameToComponent = {
      object3d: Object3DTag,
      networked: Networked,
      owned: Owned,
      AEntity
    };

    // reserve entity 0 to avoid needing to check for undefined everywhere eid is checked for existance
    addEntity(this.world);

    this.str2sid = new Map([[null, 0]]);
    this.sid2str = new Map([[0, null]]);

    window.$O = eid => this.world.eid2obj.get(eid);
  }

  // TODO nothing ever cleans these up
  getSid(str: string) {
    if (!this.str2sid.has(str)) {
      const sid = this.nextSid;
      this.nextSid = this.nextSid + 1;
      this.str2sid.set(str, sid);
      this.sid2str.set(sid, str);
      return sid;
    }
    return this.str2sid.get(str);
  }

  getString(sid: number) {
    return this.sid2str.get(sid);
  }

  // This gets called by a-scene to setup the renderer, camera, and audio listener
  // TODO ideally the contorl flow here would be inverted, and we would setup this stuff,
  // initialize aframe, and then run our own RAF loop
  setupRenderer(sceneEl: AScene) {
    const canvas = document.createElement("canvas");
    canvas.classList.add("a-canvas");
    canvas.dataset.aframeCanvas = "true";
    canvas.width = 1280;
    canvas.height = 720;
    canvas.style.backgroundColor = "black";
    document.body.style.backgroundColor = "#111";

    // TODO this comes from aframe and prevents zoom on ipad.
    // This should alreeady be handleed by disable-ios-zoom but it does not appear to work
    canvas.addEventListener("touchmove", function (event) {
      event.preventDefault();
    });

    const enablePostEffects = this.store.state.preferences.enablePostEffects;

    const renderer = new WebGLRenderer({
      alpha: true,
      antialias: !enablePostEffects,
      depth: !enablePostEffects,
      stencil: false,
      // premultipliedAlpha: true,
      // preserveDrawingBuffer: false,
      // logarithmicDepthBuffer: false,
      powerPreference: "high-performance",
      canvas
    });
    renderer.info.autoReset = false;

    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.debug.checkShaderErrors = qsTruthy("checkShaderErrors");

    // These get overridden by environment-system but setting to the highly expected defaults to avoid any extra work
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = sRGBEncoding;

    sceneEl.appendChild(renderer.domElement);

    const camera = new PerspectiveCamera(80, canvas.width / canvas.height, 0.05, 10000);

    const audioListener = new AudioListener();
    this.audioListener = audioListener;
    camera.add(audioListener);

    this.world.time = {
      delta: 0,
      elapsed: 0,
      tick: 0
    };

    this.world.scene = sceneEl.object3D;
    const scene = sceneEl.object3D;
    scene.autoUpdate = false;

    if (enablePostEffects) {
      this.initEffectsComposer(canvas, renderer, camera, scene, sceneEl);
    }

    // This gets called after all system and component init functions
    sceneEl.addEventListener("loaded", () => {
      waitForPreloads().then(() => {
        this.world.time.elapsed = performance.now();
        renderer.setAnimationLoop(function (_rafTime, xrFrame) {
          mainTick(xrFrame, renderer, scene, camera);
        });
        sceneEl.renderStarted = true;
      });
    });

    return {
      renderer,
      camera,
      audioListener
    };
  }

  initEffectsComposer(
    canvas: HTMLCanvasElement,
    renderer: WebGLRenderer,
    camera: Camera,
    scene: Scene,
    sceneEl: AScene
  ) {
    const composer = new EffectComposer(renderer, {
      frameBufferType: HalfFloatType,
      multisampling: 4
    });
    composer.autoRenderToScreen = false;
    composer.setSize(canvas.width, canvas.height, false);
    composer.outputBuffer.depthBuffer = composer.inputBuffer.depthBuffer;

    {
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
      if (this.store.state.preferences.enableBloom) {
        const bloom = new BloomEffect({
          luminanceThreshold: 1.0,
          luminanceSmoothing: 0.3,

          intensity: 1.0,
          mipmapBlur: true
        });
        bloomAndTonemapPass = new EffectPass(camera, bloom, tonemappingEffect);
      }

      let tonemapOnlyPass = new EffectPass(camera, tonemappingEffect);

      const aaMode = parseInt(this.store.state.preferences.aaMode);
      let aaPass = new EffectPass(camera, new SMAAEffect());
      aaPass.renderToScreen = true;
      composer.multisampling = aaMode > 1 ? aaMode : 0;

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

      // either aaPass or copyToScreenPass will handle the final copy to the canvas framebuffer
      aaPass.enabled = aaMode === 1;
      copyToScreenPass.enabled = !aaPass.enabled;

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

      // TODO this is a bit of a hack using an empty effect pass to copy buffers so that renderUIPass uses same depth buffer as renderScenePass
      // There should be a cleaner way to just bind the depth buffer for the renderUIPass correctly.
      (copyBuffersPass as any).skipRendering = false;
      copyBuffersPass.needsSwap = true;

      this.fx.composer = composer;
      this.fx.bloomAndTonemapPass = bloomAndTonemapPass;
      this.fx.tonemapOnlyPass = tonemapOnlyPass;

      if (bloomAndTonemapPass) {
        const bloom = (this.fx.bloomAndTonemapPass as any).effects[0] as BloomEffect;

        const debugScene = new Scene();
        const debugCamera = new OrthographicCamera(0, canvas.width, 0, canvas.height, 0.1, 100);
        debugCamera.layers.enable(Layers.CAMERA_LAYER_FX_MASK);
        debugCamera.matrixAutoUpdate = true;
        debugCamera.position.z = 5;

        // composer.addPass(debugTexturePass);
        let y = 10;
        for (let texture of [bloom.luminancePass.texture, bloom.texture]) {
          const imageMesh = createImageMesh(texture, canvas.height / canvas.width);
          imageMesh.material.depthTest = false;
          imageMesh.scale.setScalar(320);
          imageMesh.position.y = y + 90;
          imageMesh.position.x = 160 + 10;
          debugScene.add(imageMesh);
          y += 180 + 10;
        }

        const debugPass = new RenderPass(debugScene, debugCamera);
        debugPass.ignoreBackground = true;
        debugPass.clear = false;
        debugPass.renderToScreen = true;
        debugPass.enabled = false;

        composer.addPass(debugPass);

        setTimeout(function () {
          const envSystem = sceneEl.systems["hubs-systems"].environmentSystem;
          console.log(envSystem);
          const gui = envSystem.debugGui.addFolder("Post Effects Debug"); //new GUI({ container: envSystem.debugGui });
          {
            const f = gui.addFolder("Bloom");
            f.add(bloom.blendMode, "blendFunction", BlendFunction);
            f.add(bloom.blendMode.opacity, "value", 0, 1).name("Opacity");
          }

          gui
            .add({ aaMode }, "aaMode", {
              none: 0,
              SMAA: 1,
              "2x MSAA": 2,
              "4x MSAA": 4,
              "8x MSAA": 8,
              "16x MSAA": 16
            })
            .onChange(function (d: number) {
              aaPass.enabled = d === 1;
              composer.multisampling = d > 1 ? d : 0;
              console.log(aaPass.enabled, composer.multisampling);
            });
          gui.add(debugPass, "enabled").name("debug");
        }, 0);
      }
    }

    (sceneEl as any).addEventListener("rendererresize", function ({ detail }: { detail: DOMRectReadOnly }) {
      console.log("Resize", detail);
      composer.setSize(detail.width, detail.height, true);
    });
  }
}
