import { paths } from "./userinput/paths";

// The output of this system is activeTip. There are named tips (eg locomotion) that each have validators.
//
// Each frame we run all the non-finished validators and take the first tip (by order)
// which is VALID. Any tip that returns FINISHED will no longer be considered without
// a local storage reset.

// Validators can return these values:
//
// INVALID - Tip is not valid to show
// VALID - Tip is valid to show
// FINISH - Tip should always be assumed INVALID going forward
//
const INVALID = 0;
const VALID = 1;
const FINISH = 2;

const LOCAL_STORAGE_KEY = "__hubs_finished_tips";

const TIPS = {
  desktop: ["look", "locomotion", "turning", "invite"],
  mobile: ["look", "locomotion", "invite"],
  standalone: []
};

let localStorageCache = null;
let finished = false; // Optimization, lets system skip altogether once finished.

const isMobile = AFRAME.utils.device.isMobile();
const isMobileVR = AFRAME.utils.device.isMobileVR();

const tipPlatform = () => {
  if (isMobileVR) return "standalone";
  return isMobile ? "mobile" : "desktop";
};

const platformTips = TIPS[tipPlatform()];

function markTipFinished(tip) {
  const storeData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
  storeData[tip] = { finished: true };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storeData));
  localStorageCache = null;
}

const VALIDATORS = {
  look: function(userinput) {
    const cameraDelta = userinput.get(
      isMobile ? paths.device.touchscreen.touchCameraDelta : paths.device.smartMouse.cameraDelta
    );
    return cameraDelta ? FINISH : VALID;
  },
  locomotion: function(userinput) {
    const accel = userinput.get(paths.actions.characterAcceleration);

    // User moved
    return accel && (accel[0] !== 0 || accel[1] !== 0) ? FINISH : VALID;
  },
  turning: function(userinput) {
    if (userinput.get(paths.actions.snapRotateLeft) || userinput.get(paths.actions.snapRotateRight)) return FINISH;
    return VALID;
  },
  invite: function(_userinput, scene, hub) {
    if (hub && hub.entry_mode === "invite") return INVALID;
    return scene.is("copresent") ? FINISH : VALID;
  }
};

AFRAME.registerSystem("tips", {
  init: function() {
    this.activeTip = null;
    this._performStep = this._performStep.bind(this);

    if (localStorage.getItem(LOCAL_STORAGE_KEY) === null) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({}));
    }
  },

  resetTips: function() {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({}));
    localStorageCache = null;
    window.APP.store.resetTipActivityFlags();
    window.APP.store.resetConfirmedBroadcastedRooms();
    this.activeTip = null;
    finished = false;
  },

  skipTips: function() {
    for (let i = 0; i < platformTips.length; i++) {
      const tipId = platformTips[i];
      markTipFinished(tipId);
    }
  },

  tick: function() {
    if (isMobileVR) return; // Optimization for now, don't bother with this on mobile VR until we have real tips

    if (!this._userinput) {
      this._userinput = this.el.systems.userinput;

      if (!this._userinput) return;
    }

    const tips = platformTips;

    const prevTip = this.activeTip;

    this._performStep(tips);

    if (prevTip !== this.activeTip) {
      this.el.emit("tip-changed", this.activeTip);
    }
  },

  _performStep: function(tips) {
    if (finished) return;

    let chosenTip = null;
    let finishCount = 0;

    for (let i = 0; i < tips.length; i++) {
      const tip = tips[i];

      if (localStorageCache === null) {
        localStorageCache = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
      }

      if (localStorageCache[tip] && localStorageCache[tip].finished) {
        finishCount++;
        continue;
      }

      switch (VALIDATORS[tip](this._userinput, this.el, window.APP.hub)) {
        case FINISH:
          markTipFinished(tip);
          break;
        case VALID:
          chosenTip = `tips.${tipPlatform()}.${tip}`;
          break;
      }

      if (chosenTip) break;
    }

    this.activeTip = chosenTip;

    if (finishCount === tips.length) {
      // Optimization: Tips are completed no need to re-walk.
      finished = true;
    }
  }
});
