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

import {
  Audio,
  AudioListener,
  Clock,
  Object3D,
  PerspectiveCamera,
  PositionalAudio,
  Scene,
  sRGBEncoding,
  WebGLRenderer
} from "three";
import { AudioSettings, SourceType } from "./components/audio-params";
import { DialogAdapter } from "./naf-dialog-adapter";
import { waitForPreloads } from "./utils/preload";

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
  time: { delta: number; elapsed: number; tick: number; then: number };
}

window.$B = bitecs;

const timeSystem = (world: HubsWorld) => {
  const { time } = world;
  const now = performance.now();
  const delta = now - time.then;
  time.delta = delta;
  time.elapsed += delta;
  time.then = now;
  time.tick++;
  return world;
};

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

    // TODO this comes from aframe and prevents zoom on ipad.
    // This should alreeady be handleed by disable-ios-zoom but it does not appear to work
    canvas.addEventListener("touchmove", function (event) {
      event.preventDefault();
    });

    const renderer = new WebGLRenderer({
      // TODO we should not be using alpha: false https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices#avoid_alphafalse_which_can_be_expensive
      alpha: true,
      antialias: true,
      depth: true,
      stencil: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      logarithmicDepthBuffer: false,
      // TODO we probably want high-performance
      powerPreference: "high-performance",
      canvas
    });

    renderer.setPixelRatio(window.devicePixelRatio);

    renderer.debug.checkShaderErrors = qsTruthy("checkShaderErrors");

    // These get overridden by environment-system but setting to the highly expected defaults to avoid any extra work
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = sRGBEncoding;

    sceneEl.appendChild(renderer.domElement);

    const camera = new PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.05, 10000);

    const audioListener = new AudioListener();
    this.audioListener = audioListener;
    camera.add(audioListener);

    const renderClock = new Clock();

    // TODO NAF currently depends on this, it should not
    sceneEl.clock = renderClock;

    // TODO we should have 1 source of truth for time
    this.world.time = {
      delta: 0,
      elapsed: 0,
      then: performance.now(),
      tick: 0
    };

    this.world.scene = sceneEl.object3D;

    // Main RAF loop
    const mainTick = (_rafTime: number, xrFrame: XRFrame) => {
      // TODO we should probably be using time from the raf loop itself
      const delta = renderClock.getDelta() * 1000;
      const time = renderClock.elapsedTime * 1000;

      // TODO pass this into systems that care about it (like input) once they are moved into this loop
      sceneEl.frame = xrFrame;

      timeSystem(this.world);

      // Tick AFrame systems and components
      if (sceneEl.isPlaying) {
        sceneEl.tick(time, delta);
      }

      renderer.render(sceneEl.object3D, camera);
    };

    // This gets called after all system and component init functions
    sceneEl.addEventListener("loaded", () => {
      waitForPreloads().then(() => {
        renderer.setAnimationLoop(mainTick);
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
