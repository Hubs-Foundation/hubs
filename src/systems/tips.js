import { sets } from "./userinput/sets";
import { paths } from "./userinput/paths";

// The output of this system is activeTips which shows, if any, the tips to show at the top
// and bottom of the screen. There are named tips (eg locomotion) that each have validators.
//
// Each frame we run all the validators and take the first tip (by order) which is VALID
// any tip that returns FINISHED will no longer be considered.

// Validators can return these values:
//
// INVALID - Input or store activity flags incicate tip is not valid to show
// VALID - Input or store activity flags indicate tip is valid to show
// FINISH - Input or store activity flags indicate tip should always be INVALID going forward
//
// Once a validator returns FINISH, that tip will no longer ever be run or tip seen for this
// local storage context.
const INVALID = 0;
const VALID = 1;
const FINISH = 2;

const LOCAL_STORAGE_KEY = "__hubs_finished_tips";

const TIPS = {
  desktop: {
    top: ["pen_mode", "video_share_mode"],
    bottom: [
      "locomotion",
      "spawn_menu",
      "freeze_gesture",
      "menu_hover",
      "object_grab",
      "object_pin",
      "object_zoom",
      "object_scale",
      "pen_color",
      "pen_size"
    ]
  }
};

const VALIDATORS = {
  locomotion: function(userinput) {
    const accel = userinput.get(paths.actions.characterAcceleration);

    // User moved
    return accel[0] !== 0 || accel[1] !== 0 ? FINISH : VALID;
  },
  spawn_menu: function(userinput, scene, mediaCounter) {
    if (mediaCounter.count() === 0) return VALID;
    return FINISH;
  },
  freeze_gesture: function(userinput, scene, mediaCounter) {
    if (mediaCounter.count() === 0) return INVALID;
    if (scene.is("frozen") && userinput.activeSets.has(sets.cursorHoveringOnInteractable)) return FINISH;
    return scene.is("frozen") ? INVALID : VALID;
  },
  menu_hover: function(userinput, scene, mediaCounter) {
    if (mediaCounter.count() === 0) return INVALID;
    if (!scene.is("frozen")) return INVALID;
    if (scene.is("frozen") && userinput.activeSets.has(sets.cursorHoveringOnInteractable)) return FINISH;
    return VALID;
  },
  object_grab: function(userinput, scene, mediaCounter) {
    if (scene.is("frozen")) return INVALID;
    if (mediaCounter.count() === 0) return INVALID;
    if (userinput.activeSets.has(sets.cursorHoldingPen)) return INVALID;
    return VALID;
  },
  object_pin: function(userinput, scene, mediaCounter, store) {
    if (!scene.is("frozen")) return INVALID;
    if (mediaCounter.count() === 0) return INVALID;
    if (!userinput.activeSets.has(sets.cursorHoveringOnInteractable)) return INVALID;
    if (store && store.state.activity.hasPinned) return FINISH;
    return VALID;
  },
  object_zoom: function(userinput) {
    if (!userinput.activeSets.has(sets.cursorHoldingInteractable)) return INVALID;
    if (userinput.get(paths.actions.cursor.modDelta)) return FINISH;
    return VALID;
  },
  object_scale: function(userinput) {
    if (!userinput.activeSets.has(sets.cursorHoldingInteractable)) return INVALID;
    if (userinput.get(paths.actions.cursor.scaleGrabbedGrabbable)) return FINISH;
    return VALID;
  },
  pen_color: function(userinput) {
    if (!userinput.activeSets.has(sets.cursorHoldingPen)) return INVALID;
    if (userinput.get(paths.actions.cursor.penNextColor) || userinput.get(paths.actions.cursor.penPrevColor)) {
      return FINISH;
    }
    return VALID;
  },
  pen_size: function(userinput) {
    if (!userinput.activeSets.has(sets.cursorHoldingPen)) return INVALID;
    if (userinput.get(paths.actions.cursor.scalePenTip)) return FINISH;
    return VALID;
  },
  pen_mode: function(userinput) {
    if (!userinput.activeSets.has(sets.cursorHoldingPen)) return INVALID;
    return VALID;
  },
  video_share_mode: function(userinput, scene) {
    if (!scene.is("sharing_video")) return INVALID;
    return VALID;
  }
};

AFRAME.registerSystem("tips", {
  init: function() {
    this.activeTips = { bottom: {} };
    this._finishedScopes = {};
    this._performStep = this._performStep.bind(this);
    this._markFinished = this._markFinished.bind(this);
    this._isFinished = this._isFinished.bind(this);

    if (localStorage.getItem(LOCAL_STORAGE_KEY) === null) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({}));
    }

    this._tickCount = 0;
  },

  tick: function() {
    this._tickCount++;

    if (!this._userinput) {
      this._userinput = AFRAME.scenes[0].systems.userinput;

      if (!this._userinput) return;
    }

    if (!this._mediaCounter) {
      this._mediaCounter = document.querySelector("#media-counter").components["networked-counter"];

      if (!this._mediaCounter) return;
    }

    const tips = this._platformTips();

    this._performStep(tips.top, "top");

    if (!this._finishedScopes.bottom) {
      this._performStep(tips.bottom, "bottom");
    }

    if (this._tickCount % 60 === 0) {
      console.log(this.activeTips);
    }
  },

  markScopeFinished: function(scope) {
    const tips = this._platformTips[scope];

    for (let i = 0; i < tips.length; i++) {
      const tip = tips[i];
      this._markFinished(tip);
    }
  },

  _platformTips: function() {
    return TIPS.desktop;
  },

  _markFinished: function(tip) {
    const storeData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    storeData[tip] = { finished: true };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storeData));
    this._localStorageCache = null;
  },

  _isFinished: function(tip) {
    if (!this._localStorageCache) {
      this._localStorageCache = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
    }

    return !!(this._localStorageCache[tip] && this._localStorageCache[tip].finished);
  },

  _performStep: function(tips, scope) {
    const scene = AFRAME.scenes[0];
    this.activeTips[scope] = null;
    let finishCount = 0;

    for (let i = 0; i < tips.length; i++) {
      const tip = tips[i];
      if (this._isFinished(tip)) {
        finishCount++;
        continue;
      }

      switch (VALIDATORS[tip](this._userinput, scene, this._mediaCounter, window.APP.store)) {
        case FINISH:
          this._markFinished(tip);
          break;
        case VALID:
          this.activeTips[scope] = tip;
          break;
      }

      if (this.activeTips[scope]) break;
    }

    if (finishCount === tips.length) {
      // Optimization: Tips are completed for this scope.
      this._finishedScopes[scope] = true;
    }
  }
});
