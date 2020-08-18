import { sets } from "./userinput/sets";
import { paths } from "./userinput/paths";

// The output of this system is activeTips which shows, if any, the tips to show at the top
// and bottom of the screen. There are named tips (eg locomotion) that each have validators.
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
//
// Tips have "scope", which is a certain context within which the validators are run (right now,
// just the top of bottom of the screen.) They are also platform-local.
const INVALID = 0;
const VALID = 1;
const FINISH = 2;

const LOCAL_STORAGE_KEY = "__hubs_finished_tips";

const TIPS = {
  desktop: {
    top: ["pen_mode", "video_share_mode", "mute_mode"],
    bottom: [
      "look",
      "locomotion",
      "turning",
      "spawn_menu",
      "object_grab",
      "object_zoom",
      "object_scale",
      "freeze_gesture",
      "menu_hover",
      "object_rotate_button",
      "object_scale_button",
      "object_pin",
      "invite",
      "pen_color",
      "pen_size",
      "feedback"
    ]
  },
  mobile: {
    top: ["pen_mode", "video_share_mode", "freeze_mode", "mute_mode"],
    bottom: [
      "look",
      "locomotion",
      "spawn_menu",
      "object_grab",
      "freeze_gesture",
      "object_rotate_button",
      "object_scale_button",
      "object_pin",
      "invite",
      "feedback"
    ]
  },
  standalone: { top: [], bottom: [] }
};

// These tips, if closed, will only clear themselves, not all tips.
const LOCAL_CLOSE_TIPS = ["feedback", "invite", "object_pin"];

// These tips will remain active even if the user closes the tips globally.
const KEEP_ACTIVE_AFTER_GLOBAL_CLOSE = ["freeze_gesture", "menu_hover", "feedback"];

let localStorageCache = null;
let finishedScopes = {}; // Optimization, lets system skip scopes altogether once finished.

const isMobile = AFRAME.utils.device.isMobile();
const isMobileVR = AFRAME.utils.device.isMobileVR();

const tipPlatform = () => {
  if (isMobileVR) return "standalone";
  return isMobile ? "mobile" : "desktop";
};

const platformTips = TIPS[tipPlatform()];

const isTipFinished = tip => {
  if (localStorageCache === null) {
    localStorageCache = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
  }

  return !!(localStorageCache[tip] && localStorageCache[tip].finished);
};

export const markTipFinished = tip => {
  const storeData = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY));
  storeData[tip] = { finished: true };
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(storeData));
  localStorageCache = null;
};

export const handleTipClose = (fullTip, scope) => {
  const tip = fullTip.split(".")[1];

  // Invite and pinning tips should be locally cleared, others should clear all remaining tips.
  const tips = LOCAL_CLOSE_TIPS.includes(tip) ? [tip] : platformTips[scope];

  for (let i = 0; i < tips.length; i++) {
    const t = tips[i];

    if (!KEEP_ACTIVE_AFTER_GLOBAL_CLOSE.includes(t) || t === tip) {
      markTipFinished(t);
    }
  }
};

export const resetTips = () => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({}));
  localStorageCache = null;
  window.APP.store.resetTipActivityFlags();
  window.APP.store.resetConfirmedBroadcastedRooms();
  finishedScopes = {};
};

const VALIDATORS = {
  look: function(userinput) {
    if (
      userinput.activeSets.includes(sets.rightCursorHoldingPen) ||
      userinput.activeSets.includes(sets.leftCursorHoldingPen)
    )
      return INVALID;
    const cameraDelta = userinput.get(
      isMobile ? paths.device.touchscreen.touchCameraDelta : paths.device.smartMouse.cameraDelta
    );
    return cameraDelta ? FINISH : VALID;
  },
  locomotion: function(userinput) {
    if (
      userinput.activeSets.includes(sets.rightCursorHoldingPen) ||
      userinput.activeSets.includes(sets.leftCursorHoldingPen)
    )
      return INVALID;
    const accel = userinput.get(paths.actions.characterAcceleration);

    // User moved
    return accel && (accel[0] !== 0 || accel[1] !== 0) ? FINISH : VALID;
  },
  turning: function(userinput) {
    if (
      userinput.activeSets.includes(sets.rightCursorHoldingPen) ||
      userinput.activeSets.includes(sets.leftCursorHoldingPen)
    )
      return INVALID;
    if (userinput.get(paths.actions.snapRotateLeft) || userinput.get(paths.actions.snapRotateRight)) return FINISH;
    return VALID;
  },
  spawn_menu: function(userinput, scene, mediaCounter) {
    if (
      userinput.activeSets.includes(sets.rightCursorHoldingPen) ||
      userinput.activeSets.includes(sets.leftCursorHoldingPen)
    )
      return INVALID;
    if (mediaCounter.count() === 0) return VALID;
    return FINISH;
  },
  freeze_gesture: function(userinput, scene, mediaCounter) {
    if (mediaCounter.count() === 0) return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingInteractable)) return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingPen)) return INVALID;
    if (userinput.activeSets.includes(sets.leftCursorHoldingInteractable)) return INVALID;
    if (userinput.activeSets.includes(sets.leftCursorHoldingPen)) return INVALID;
    if (
      scene.is("frozen") &&
      (userinput.activeSets.includes(sets.rightCursorHoveringOnInteractable) ||
        userinput.activeSets.includes(sets.leftCursorHoveringOnInteractable))
    )
      return FINISH;
    return scene.is("frozen") ? INVALID : VALID;
  },
  menu_hover: function(userinput, scene, mediaCounter) {
    if (mediaCounter.count() === 0) return INVALID;
    if (!scene.is("frozen")) return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingPen)) return INVALID;
    if (userinput.activeSets.includes(sets.leftCursorHoldingPen)) return INVALID;
    if (
      scene.is("frozen") &&
      (userinput.activeSets.includes(sets.rightCursorHoveringOnInteractable) ||
        userinput.activeSets.includes(sets.leftCursorHoveringOnInteractable))
    )
      return FINISH;
    return VALID;
  },
  invite: function(userinput, scene, _mediaCounter, _store, hub) {
    if (hub && hub.entry_mode === "invite") return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingPen)) return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingCamera)) return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingInteractable)) return INVALID;
    if (userinput.activeSets.includes(sets.leftCursorHoldingPen)) return INVALID;
    if (userinput.activeSets.includes(sets.leftCursorHoldingCamera)) return INVALID;
    if (userinput.activeSets.includes(sets.leftCursorHoldingInteractable)) return INVALID;
    return scene.is("copresent") ? FINISH : VALID;
  },
  object_grab: function(userinput, scene, mediaCounter) {
    if (scene.is("frozen")) return INVALID;
    if (mediaCounter.count() === 0) return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingPen)) return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingCamera)) return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingInteractable)) return FINISH;
    if (userinput.activeSets.includes(sets.leftCursorHoldingPen)) return INVALID;
    if (userinput.activeSets.includes(sets.leftCursorHoldingCamera)) return INVALID;
    if (userinput.activeSets.includes(sets.leftCursorHoldingInteractable)) return FINISH;
    return VALID;
  },
  object_rotate_button: function(userinput, scene, mediaCounter, store) {
    if (!scene.is("frozen")) return INVALID;
    if (mediaCounter.count() === 0) return INVALID;
    if (store && store.state.activity.hasRotated) return FINISH;
    return VALID;
  },
  object_scale_button: function(userinput, scene, mediaCounter, store) {
    if (!scene.is("frozen")) return INVALID;
    if (mediaCounter.count() === 0) return INVALID;
    if (store && store.state.activity.hasScaled) return FINISH;
    return VALID;
  },
  object_recenter_button: function(userinput, scene, mediaCounter, store) {
    if (!scene.is("frozen")) return INVALID;
    if (mediaCounter.count() === 0) return INVALID;
    if (store && store.state.activity.hasRecentered) return FINISH;
    return VALID;
  },
  object_pin: function(userinput, scene, mediaCounter, store) {
    if (!scene.is("frozen")) return INVALID;
    if (mediaCounter.count() === 0) return INVALID;
    if (store && store.state.activity.hasPinned) return FINISH;
    return VALID;
  },
  object_zoom: function(userinput, scene) {
    if (scene.is("frozen")) return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingPen)) return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingCamera)) return INVALID;
    if (
      !(
        userinput.activeSets.includes(sets.rightCursorHoldingInteractable) ||
        userinput.activeSets.includes(sets.leftCursorHoldingInteractable)
      )
    )
      return INVALID;
    if (userinput.activeSets.includes(sets.leftCursorHoldingPen)) return INVALID;
    if (userinput.activeSets.includes(sets.leftCursorHoldingCamera)) return INVALID;
    if (userinput.get(paths.actions.cursor.right.modDelta)) return FINISH;
    if (userinput.get(paths.actions.cursor.left.modDelta)) return FINISH;
    return VALID;
  },
  object_scale: function(userinput, scene) {
    if (scene.is("frozen")) return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingPen)) return INVALID;
    if (userinput.activeSets.includes(sets.rightCursorHoldingCamera)) return INVALID;
    if (userinput.activeSets.includes(sets.leftCursorHoldingPen)) return INVALID;
    if (userinput.activeSets.includes(sets.leftCursorHoldingCamera)) return INVALID;
    if (
      !(
        userinput.activeSets.includes(sets.rightCursorHoldingInteractable) ||
        userinput.activeSets.includes(sets.leftCursorHoldingInteractable)
      )
    )
      return INVALID;
    if (
      userinput.get(paths.actions.cursor.right.scaleGrabbedGrabbable) ||
      userinput.get(paths.actions.cursor.left.scaleGrabbedGrabbable)
    )
      return FINISH;
    return VALID;
  },
  pen_color: function(userinput) {
    if (
      !(
        userinput.activeSets.includes(sets.rightCursorHoldingPen) ||
        userinput.activeSets.includes(sets.leftCursorHoldingPen)
      )
    )
      return INVALID;
    if (
      userinput.get(paths.actions.cursor.right.penNextColor) ||
      userinput.get(paths.actions.cursor.right.penPrevColor)
    ) {
      return FINISH;
    }
    if (
      userinput.get(paths.actions.cursor.left.penNextColor) ||
      userinput.get(paths.actions.cursor.left.penPrevColor)
    ) {
      return FINISH;
    }
    return VALID;
  },
  pen_size: function(userinput) {
    if (
      !(
        userinput.activeSets.includes(sets.rightCursorHoldingPen) ||
        userinput.activeSets.includes(sets.leftCursorHoldingPen)
      )
    )
      return INVALID;
    if (userinput.get(paths.actions.cursor.right.scalePenTip) || userinput.get(paths.actions.cursor.left.scalePenTip))
      return FINISH;
    return VALID;
  },
  pen_mode: function(userinput) {
    if (
      !userinput.activeSets.includes(sets.rightCursorHoldingPen) &&
      !userinput.activeSets.includes(sets.leftCursorHoldingPen)
    )
      return INVALID;
    return VALID;
  },
  freeze_mode: function(userinput, scene) {
    return scene.is("frozen") ? VALID : INVALID;
  },
  video_share_mode: function(userinput, scene) {
    return scene.is("sharing_video") ? VALID : INVALID;
  },
  mute_mode: function(userinput, scene) {
    return scene.is("muted") ? VALID : INVALID;
  },
  feedback: function(/*userinput, scene, mediaCounter, store*/) {
    /*if (configs.feature("show_feedback_ui") && store && store.state.activity.entryCount >= NUM_ENTRIES_FOR_FEEDBACK_TIP)
      return VALID;*/
    return INVALID;
  }
};

AFRAME.registerSystem("tips", {
  init: function() {
    this.activeTips = {};
    this._finishedScopes = {};
    this._performStep = this._performStep.bind(this);

    if (localStorage.getItem(LOCAL_STORAGE_KEY) === null) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify({}));
    }
  },

  tick: function() {
    if (isMobileVR) return; // Optimization for now, don't bother with this on mobile VR until we have real tips

    if (!this._userinput) {
      this._userinput = this.el.systems.userinput;

      if (!this._userinput) return;
    }

    if (!this._mediaCounter) {
      this._mediaCounter =
        document.querySelector("#media-counter") &&
        document.querySelector("#media-counter").components["networked-counter"];

      if (!this._mediaCounter) return;
    }

    const tips = platformTips;

    const prevTop = this.activeTips.top;
    const prevBottom = this.activeTips.bottom;

    this._performStep(tips.top, "top");
    this._performStep(tips.bottom, "bottom");

    if (prevTop !== this.activeTips.top || prevBottom !== this.activeTips.bottom) {
      this.el.emit("tips_changed", this.activeTips);
    }
  },

  _performStep: function(tips, scope) {
    if (finishedScopes[scope]) return;

    let chosenTip = null;
    let finishCount = 0;

    for (let i = 0; i < tips.length; i++) {
      const tip = tips[i];
      if (isTipFinished(tip)) {
        finishCount++;
        continue;
      }

      switch (VALIDATORS[tip](this._userinput, this.el, this._mediaCounter, window.APP.store, window.APP.hub)) {
        case FINISH:
          markTipFinished(tip);
          break;
        case VALID:
          chosenTip = `${tipPlatform()}.${tip}`;
          break;
      }

      if (chosenTip) break;
    }

    this.activeTips[scope] = chosenTip;

    if (finishCount === tips.length) {
      // Optimization: Tips are completed for this scope, no need to re-walk.
      finishedScopes[scope] = true;
    }
  }
});
