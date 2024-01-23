import { addEntity, createWorld, IWorld } from "bitecs";
import "./aframe-to-bit-components";
import { AEntity, Networked, Object3DTag, Owned } from "./bit-components";
import MediaSearchStore from "./storage/media-search-store";
import Store from "./storage/store";
import qsTruthy from "./utils/qs_truthy";

import type { AComponent, AScene } from "aframe";
import HubChannel from "./utils/hub-channel";
import MediaDevicesManager from "./utils/media-devices-manager";

import { EffectComposer, EffectPass } from "postprocessing";
import {
  Audio,
  AudioListener,
  Material,
  Object3D,
  PerspectiveCamera,
  PositionalAudio,
  Scene,
  sRGBEncoding,
  WebGLRenderer
} from "three";
import { AudioSettings, SourceType } from "./components/audio-params";
import { createEffectsComposer } from "./effects";
import { DialogAdapter } from "./naf-dialog-adapter";
import { mainTick } from "./systems/hubs-systems";
import { waitForPreloads } from "./utils/preload";
import SceneEntryManager from "./scene-entry-manager";
import { store } from "./utils/store-instance";
import { addObject3DComponent } from "./utils/jsx-entity";
import { ElOrEid } from "./utils/bit-utils";

declare global {
  interface Window {
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
  eid2mat: Map<number, Material>;
  time: { delta: number; elapsed: number; tick: number };
}

let resolvePromiseToScene: (value: Scene) => void;
const promiseToScene: Promise<Scene> = new Promise(resolve => {
  resolvePromiseToScene = resolve;
});
export function getScene() {
  return promiseToScene;
}

interface HubDescription {
  hub_id: string;
  user_data?: any;
}

export class App {
  scene?: AScene;
  hubChannel?: HubChannel;
  hub?: HubDescription;
  mediaDevicesManager?: MediaDevicesManager;
  entryManager?: SceneEntryManager;
  messageDispatch?: any;
  store: Store;
  componentRegistry: { [key: string]: AComponent[] };

  mediaSearchStore = new MediaSearchStore();

  audios = new Map<ElOrEid, PositionalAudio | Audio>();
  sourceType = new Map<ElOrEid, SourceType>();
  audioOverrides = new Map<ElOrEid, Partial<AudioSettings>>();
  zoneOverrides = new Map<ElOrEid, Partial<AudioSettings>>();
  gainMultipliers = new Map<ElOrEid, number>();
  supplementaryAttenuation = new Map<ElOrEid, number>();
  clippingState = new Set<ElOrEid>();
  mutedState = new Set<ElOrEid>();
  linkedMutedState = new Set<ElOrEid>();
  isAudioPaused = new Set<ElOrEid>();
  audioDebugPanelOverrides = new Map<SourceType, Partial<AudioSettings>>();
  sceneAudioDefaults = new Map<SourceType, Partial<AudioSettings>>();
  moderatorAudioSource = new Set<ElOrEid>();

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
    this.store = store;
    // TODO: Create accessor / update methods for these maps / set
    this.world.eid2obj = new Map();
    this.world.eid2mat = new Map();

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
    return this.str2sid.get(str)!;
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
      powerPreference: "high-performance",
      canvas
    });

    // We manually handle resetting this in mainTick so that stats are correctly reported with post effects enabled
    renderer.info.autoReset = false;

    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.debug.checkShaderErrors = qsTruthy("checkShaderErrors");

    // These get overridden by environment-system but setting to the highly expected defaults to avoid any extra work
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = sRGBEncoding;

    sceneEl.appendChild(renderer.domElement);

    const camera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.05, 10000);

    const audioListener = new AudioListener();
    this.audioListener = audioListener;
    const audioListenerEid = addEntity(this.world);
    addObject3DComponent(this.world, audioListenerEid, this.audioListener);

    camera.add(audioListener);

    this.world.time = {
      delta: 0,
      elapsed: 0,
      tick: 0
    };

    this.scene = sceneEl;
    const scene = sceneEl.object3D;
    this.world.scene = scene;
    resolvePromiseToScene(scene);

    // We manually call scene.updateMatrixWolrd in mainTick
    scene.autoUpdate = false;

    if (enablePostEffects) {
      this.fx = createEffectsComposer(canvas, renderer, camera, scene, sceneEl, this.store);
    } else {
      // EffectComposer manages renderer size internally
      (sceneEl as any).addEventListener("rendererresize", function ({ detail }: { detail: DOMRectReadOnly }) {
        renderer.setSize(detail.width, detail.height, false);
      });
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
}
