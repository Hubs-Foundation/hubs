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
}
