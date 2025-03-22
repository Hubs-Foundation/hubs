import { paths } from "./userinput/paths";

// The output of this system is activeTip. There are named tips (eg locomotion) that each have validators.
//
// Each frame we run all the non-finished validators and take the first tip (by order)
// which is VALID. Any tip that returns FINISH will no longer be considered without
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
  desktop: ["welcome", "locomotion", "turning", "defense", "invite", "end", "menu"],
  mobile: ["welcome", "locomotion", "turning", "defense", "invite", "end", "menu"],
  standalone: ["welcome", "locomotion", "turning", "defense", "invite", "end", "menu"]
};

let localStorageCache = null;
let finished = false; // Optimization, lets system skip altogether once finished.

const isMobile = AFRAME.utils.device.isMobile();
const isThisMobileVR = AFRAME.utils.device.isMobileVR();   // used every tick

const tipPlatform = () => {
  if (isThisMobileVR) return "standalone";
  return isMobile ? "mobile" : "desktop";
};

const platformTips = TIPS[tipPlatform()];

function markTipFinished(tip) {
  const storeData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
  storeData[tip] = { finished: true };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storeData));
  localStorageCache = null;
}

function markTipUnfinished(tip) {
  const storeData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
  delete storeData[tip];
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storeData));
  localStorageCache = null;
}

function storedStateForTip(tip) {
  const storeData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
  return storeData[tip] && storeData[tip][finished] === true ? FINISH : VALID;
}

const VALIDATORS = {
  welcome: function () {
    return storedStateForTip("welcome");
  },
  locomotion: function (userinput) {
    const accel = userinput.get(paths.actions.characterAcceleration);

    // User moved
    return accel && (accel[0] !== 0 || accel[1] !== 0) ? FINISH : VALID;
  },
  turning: function (userinput) {
    const rotate = userinput.get(paths.actions.snapRotateLeft) || userinput.get(paths.actions.snapRotateRight);
    const cameraDelta = userinput.get(
      isMobile ? paths.device.touchscreen.touchCameraDelta : paths.device.smartMouse.cameraDelta
    );
    return rotate || cameraDelta ? FINISH : VALID;
  },
  defense: function (userinput) {
    const usedFreeze = userinput.get(paths.actions.toggleFreeze);
    return usedFreeze ? FINISH : VALID;
  },
  invite: function (_userinput, scene, hub) {
    if (hub && hub.entry_mode === "invite") return INVALID;
    return scene.is("copresent") ? FINISH : VALID;
  },
  end: function () {
    return storedStateForTip("end");
  },
  menu: function () {
    return storedStateForTip("menu");
  }
};

AFRAME.registerSystem("tips", {
  init: function () {
    this.activeTip = null;
    this._performStep = this._performStep.bind(this);

    const storeData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    if (storeData === null) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({}));
    } else {
      const currentKeys = Object.keys(storeData);
      const isOldTips = !currentKeys.every(item => platformTips.includes(item));
      // If they have old tips we just complete the tour.
      if (isOldTips) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({}));
        this.skipTips();
      }
    }
  },

  resetTips: function () {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({}));
    localStorageCache = null;
    window.APP.store.resetTipActivityFlags();
    window.APP.store.resetConfirmedBroadcastedRooms();
    this.activeTip = null;
    finished = false;
  },

  skipTips: function () {
    for (let i = 0; i < platformTips.length; i++) {
      const tipId = platformTips[i];
      markTipFinished(tipId);
    }
  },

  prevTip: function () {
    const step = this.activeTip.split(".")[2];
    let index = platformTips.indexOf(step);
    const prevStep = platformTips[index > 0 ? --index : 0];
    markTipUnfinished(prevStep);
  },

  nextTip: function () {
    const step = this.activeTip.split(".")[2];
    markTipFinished(step);
  },

  tick: function () {
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

  _performStep: function (tips) {
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
