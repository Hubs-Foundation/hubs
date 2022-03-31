import Store from "./storage/store";
import MediaSearchStore from "./storage/media-search-store";

export class App {
  constructor() {
    this.scene = null;
    this.store = new Store();
    this.mediaSearchStore = new MediaSearchStore();
    this.hubChannel = null;
    this.mediaDevicesManager = null;

    // TODO: Remove comments
    // TODO: Rename or reconfigure these as needed
    this.audios = new Map(); //                           el -> (THREE.Audio || THREE.PositionalAudio)
    this.sourceType = new Map(); //                       el -> SourceType
    this.audioOverrides = new Map(); //                   el -> AudioSettings
    this.zoneOverrides = new Map(); //                    el -> AudioSettings
    this.audioDebugPanelOverrides = new Map(); // SourceType -> AudioSettings
    this.sceneAudioDefaults = new Map(); //       SourceType -> AudioSettings
    this.gainMultipliers = new Map(); //                  el -> Number
    this.supplementaryAttenuation = new Map(); //         el -> Number
    this.clippingState = new Set();
    this.mutedState = new Set();
    this.isAudioPaused = new Set();
  }

  // This gets called by a-scene to setup the renderer, camera, and audio listener
  // TODO ideally the contorl flow here would be inverted, and we would setup this stuff,
  // initialize aframe, and then run our own RAF loop
  setupRenderer(sceneEl) {
    const canvas = document.createElement("canvas");
    canvas.classList.add("a-canvas");
    canvas.dataset.aframeCanvas = true;

    const renderer = new THREE.WebGLRenderer({
      alpha: false,
      antialias: true,
      depth: true,
      stencil: true,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      logarithmicDepthBuffer: false,
      powerPreference: "default",
      canvas
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.sortObjects = false;
    renderer.physicallyCorrectLights = true;
    renderer.outputEncoding = THREE.sRGBEncoding;

    sceneEl.maxCanvasSize = { height: 1920, width: 1920 };
    sceneEl.appendChild(renderer.domElement);

    const camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.05, 10000);

    const audioListener = new THREE.AudioListener();
    camera.add(audioListener);

    const renderClock = new THREE.Clock();

    // Main RAF loop
    function mainTick(_rafTime, _xrFrame) {
      const delta = renderClock.getDelta() * 1000;
      const time = renderClock.elapsedTime * 1000;

      // Tick AFrame systems and components
      if (sceneEl.isPlaying) {
        sceneEl.tick(time, delta);
      }

      renderer.render(sceneEl.object3D, camera);
    }

    // This gets called after all system and component init functions
    sceneEl.addEventListener("loaded", () => {
      console.log("scene loaded");

      // Kick off render loop.
      // if (sceneEl.renderer) {
      //   if (window.performance) { window.performance.mark('render-started'); }
      //   vrDisplay = utils.device.getVRDisplay();
      //   if (vrDisplay && vrDisplay.isPresenting) {
      //     vrManager.setDevice(vrDisplay);
      //     vrManager.enabled = true;
      //     sceneEl.enterVR();
      //   }
      renderer.setAnimationLoop(mainTick);
      sceneEl.renderStarted = true;
    });

    return {
      renderer,
      camera,
      audioListener
    };
  }
}
