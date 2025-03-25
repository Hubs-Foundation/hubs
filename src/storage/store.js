import { Validator } from "jsonschema";
import merge from "deepmerge";
import Cookies from "js-cookie";
import jwtDecode from "jwt-decode";
import { qsGet } from "../utils/qs_truthy.js";
import detectMobile, { isAndroid, isMobileVR } from "../utils/is-mobile";

const LOCAL_STORE_KEY = "___hubs_store";
const STORE_STATE_CACHE_KEY = Symbol();
const OAUTH_FLOW_CREDENTIALS_KEY = "ret-oauth-flow-account-credentials";
const validator = new Validator();
import { EventTarget } from "event-target-shim";
import { fetchRandomDefaultAvatarId, generateRandomName } from "../utils/identity.js";
import { NO_DEVICE_ID } from "../utils/media-devices-utils.js";
import { AAModes } from "../constants";

const defaultMaterialQuality = (function () {
  const MATERIAL_QUALITY_OPTIONS = ["low", "medium", "high"];

  // HACK: AFRAME is not available on all pages, so we catch the ReferenceError.
  // We could move AFRAME's device utils into a separate package (or into this repo)
  // if we wanted to use these checks without having to import all of AFRAME.
  const isMobile = window.AFRAME && (AFRAME.utils.device.isMobile() || AFRAME.utils.device.isMobileVR());
  if (isMobile) {
    const qsMobileDefault = qsGet("default_mobile_material_quality");
    if (qsMobileDefault && MATERIAL_QUALITY_OPTIONS.indexOf(qsMobileDefault) !== -1) {
      return qsMobileDefault;
    }
    return "low";
  }

  const qsDefault = qsGet("default_material_quality");
  if (qsDefault && MATERIAL_QUALITY_OPTIONS.indexOf(qsDefault) !== -1) {
    return qsDefault;
  }

  return "high";
})();

// WebAudio on Android devices (only non-VR devices?) seems to have
// a bug and audio can be broken if there are many people in a room.
// We have reported the problem to the Android devs. We found that
// using equal power panning mode can mitigate the problem so we
// use low audio panning quality (= equal power mode) by default
// on Android as workaround until the root issue is fixed on
// Android end. See
//   - https://github.com/Hubs-Foundation/hubs/issues/5057
//   - https://bugs.chromium.org/p/chromium/issues/detail?id=1308962
const defaultAudioPanningQuality = () => {
  return isAndroid() && !isMobileVR() ? "Low" : "High";
};

//workaround for https://bugzilla.mozilla.org/show_bug.cgi?id=1626081 : disable echoCancellation, noiseSuppression, autoGainControl
const isFirefoxReality = window.AFRAME?.utils.device.isMobileVR() && navigator.userAgent.match(/Firefox/);

// Durable (via local-storage) schema-enforced state that is meant to be consumed via forward data flow.
// (Think flux but with way less incidental complexity, at least for now :))
export const SCHEMA = {
  id: "/HubsStore",

  definitions: {
    profile: {
      type: "object",
      additionalProperties: false,
      properties: {
        displayName: { type: "string", pattern: "^[A-Za-z0-9_~\\s\\-]{3,32}$" },
        avatarId: { type: "string" },
        pronouns: { type: "string", pattern: "^([a-zA-Z]{1,32}[\\/, ]\\s*){0,4}[a-zA-Z]{1,32}$" },
        // personalAvatarId is obsolete, but we need it here for backwards compatibility.
        personalAvatarId: { type: "string" }
      }
    },

    credentials: {
      type: "object",
      additionalProperties: false,
      properties: {
        token: { type: ["null", "string"] },
        email: { type: ["null", "string"] }
      }
    },

    activity: {
      type: "object",
      additionalProperties: false,
      properties: {
        hasFoundFreeze: { type: "boolean" },
        hasChangedNameOrPronouns: { type: "boolean" },
        hasAcceptedProfile: { type: "boolean" },
        lastEnteredAt: { type: "string" },
        hasPinned: { type: "boolean" },
        hasRotated: { type: "boolean" },
        hasRecentered: { type: "boolean" },
        hasScaled: { type: "boolean" },
        hasHoveredInWorldHud: { type: "boolean" },
        hasOpenedShare: { type: "boolean" },
        entryCount: { type: "number" }
      }
    },

    settings: {
      type: "object",
      additionalProperties: false,
      properties: {
        lastUsedMicDeviceId: { type: "string" },
        micMuted: { type: "bool" }
      }
    },

    preferences: {
      type: "object",
      additionalProperties: false,
      properties: {
        shouldPromptForRefresh: { type: "bool", default: false },
        // Preferred media will be set dynamically
        preferredMic: { type: "string", default: NO_DEVICE_ID },
        preferredSpeakers: { type: "string", default: NO_DEVICE_ID },
        preferredCamera: { type: "string", default: NO_DEVICE_ID },
        muteMicOnEntry: { type: "bool", default: false },
        disableLeftRightPanning: { type: "bool", default: false },
        audioNormalization: { type: "bool", default: 0.0 },
        invertTouchscreenCameraMove: { type: "bool", default: true },
        enableOnScreenJoystickLeft: { type: "bool", default: detectMobile() },
        enableOnScreenJoystickRight: { type: "bool", default: detectMobile() },
        enableGyro: { type: "bool", default: true },
        animateWaypointTransitions: { type: "bool", default: true },
        showFPSCounter: { type: "bool", default: false },
        allowMultipleHubsInstances: { type: "bool", default: false },
        disableIdleDetection: { type: "bool", default: false },
        fastRoomSwitching: { type: "bool", default: false }, // No longer used. TODO How to remove this safely?
        lazyLoadSceneMedia: { type: "bool", default: false },
        preferMobileObjectInfoPanel: { type: "bool", default: false },
        // if unset, maxResolution = screen resolution
        maxResolutionWidth: { type: "number", default: undefined },
        maxResolutionHeight: { type: "number", default: undefined },
        globalVoiceVolume: { type: "number", default: 100 },
        globalMediaVolume: { type: "number", default: 100 },
        globalSFXVolume: { type: "number", default: 100 },
        snapRotationDegrees: { type: "number", default: 45 },
        materialQualitySetting: { type: "string", default: defaultMaterialQuality },
        enableDynamicShadows: { type: "bool", default: false },
        disableSoundEffects: { type: "bool", default: false },
        disableMovement: { type: "bool", default: false },
        disableBackwardsMovement: { type: "bool", default: false },
        disableStrafing: { type: "bool", default: false },
        disableTeleporter: { type: "bool", default: false },
        disableAutoPixelRatio: { type: "bool", default: false },
        movementSpeedModifier: { type: "number", default: 1 },
        disableEchoCancellation: { type: "bool", default: isFirefoxReality },
        disableNoiseSuppression: { type: "bool", default: isFirefoxReality },
        disableAutoGainControl: { type: "bool", default: isFirefoxReality },
        locale: { type: "string", default: "browser" },
        showRtcDebugPanel: { type: "bool", default: false },
        showAudioDebugPanel: { type: "bool", default: false },
        enableAudioClipping: { type: "bool", default: false },
        audioClippingThreshold: { type: "number", default: 0.015 },
        audioPanningQuality: { type: "string", default: defaultAudioPanningQuality() },
        theme: { type: "string", default: undefined },
        cursorSize: { type: "number", default: 1 },
        nametagVisibility: { type: "string", default: "showAll" },
        nametagVisibilityDistance: { type: "number", default: 5 },
        avatarVoiceLevels: { type: "object" },
        enablePostEffects: { type: "bool", default: false },
        enableBloom: { type: "bool", default: true }, // only applies if post effects are enabled
        aaMode: { type: "string", default: AAModes.MSAA_4X } // only applies if post effects are enabled
      }
    },

    // Legacy
    confirmedDiscordRooms: {
      type: "array",
      items: { type: "string" }
    },

    confirmedBroadcastedRooms: {
      type: "array",
      items: { type: "string" }
    },

    uploadPromotionTokens: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          fileId: { type: "string" },
          promotionToken: { type: "string" }
        }
      }
    },

    creatorAssignmentTokens: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          hubId: { type: "string" },
          creatorAssignmentToken: { type: "string" }
        }
      }
    },

    embedTokens: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          hubId: { type: "string" },
          embedToken: { type: "string" }
        }
      }
    },

    onLoadActions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          action: { type: "string" },
          args: { type: "object" }
        }
      }
    }
  },

  type: "object",

  properties: {
    profile: { $ref: "#/definitions/profile" },
    credentials: { $ref: "#/definitions/credentials" },
    activity: { $ref: "#/definitions/activity" },
    settings: { $ref: "#/definitions/settings" },
    preferences: { $ref: "#/definitions/preferences" },
    confirmedDiscordRooms: { $ref: "#/definitions/confirmedDiscordRooms" }, // Legacy
    confirmedBroadcastedRooms: { $ref: "#/definitions/confirmedBroadcastedRooms" },
    uploadPromotionTokens: { $ref: "#/definitions/uploadPromotionTokens" },
    creatorAssignmentTokens: { $ref: "#/definitions/creatorAssignmentTokens" },
    embedTokens: { $ref: "#/definitions/embedTokens" },
    onLoadActions: { $ref: "#/definitions/onLoadActions" }
  },

  additionalProperties: false
};

export default class Store extends EventTarget {
  constructor() {
    super();

    this._preferences = {};

    if (localStorage.getItem(LOCAL_STORE_KEY) === null) {
      localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify({}));
    }

    // When storage is updated in another window
    window.addEventListener("storage", e => {
      if (e.key !== LOCAL_STORE_KEY) return;
      delete this[STORE_STATE_CACHE_KEY];
      this.dispatchEvent(new CustomEvent("statechanged"));
    });

    this.update({
      activity: {},
      settings: {},
      credentials: {},
      profile: {},
      confirmedDiscordRooms: [],
      confirmedBroadcastedRooms: [],
      uploadPromotionTokens: [],
      creatorAssignmentTokens: [],
      embedTokens: [],
      onLoadActions: [],
      preferences: {}
    });

    this._shouldResetAvatarOnInit = false;

    const oauthFlowCredentials = Cookies.getJSON(OAUTH_FLOW_CREDENTIALS_KEY);
    if (oauthFlowCredentials) {
      this.update({ credentials: oauthFlowCredentials });
      this._shouldResetAvatarOnInit = true;
      Cookies.remove(OAUTH_FLOW_CREDENTIALS_KEY);
    }

    this._signOutOnExpiredAuthToken();

    const maybeDispatchThemeChanged = (() => {
      let previous;
      return () => {
        const current = this.state.preferences.theme;
        if ((previous || current) && previous !== current) {
          this.dispatchEvent(new CustomEvent("themechanged", { detail: { current, previous } }));
        }
        previous = current;
        console.log("Theme updated to: ", current);
      };
    })();
    this.addEventListener("statechanged", maybeDispatchThemeChanged);
  }

  _signOutOnExpiredAuthToken = () => {
    if (!this.state.credentials.token) return;

    const expiry = jwtDecode(this.state.credentials.token).exp * 1000;
    if (expiry <= Date.now()) {
      this.update({ credentials: { token: null, email: null } });
    }
  };

  initProfile = async () => {
    if (this._shouldResetAvatarOnInit) {
      await this.resetToRandomDefaultAvatar();
    } else {
      this.update({
        profile: { avatarId: await fetchRandomDefaultAvatarId(), ...(this.state.profile || {}) }
      });
    }

    // Regenerate name to encourage users to change it.
    if (!this.state.activity.hasChangedNameOrPronouns) {
      this.update({ profile: { displayName: generateRandomName() } });
    }
  };

  resetToRandomDefaultAvatar = async () => {
    this.update({
      profile: { ...(this.state.profile || {}), avatarId: await fetchRandomDefaultAvatarId() }
    });
  };

  get state() {
    if (!Object.prototype.hasOwnProperty.call(this, STORE_STATE_CACHE_KEY)) {
      const state = (this[STORE_STATE_CACHE_KEY] = JSON.parse(localStorage.getItem(LOCAL_STORE_KEY)));
      if (!state.preferences) state.preferences = {};
      this._preferences = { ...state.preferences }; // cache prefs without injected defaults
      // inject default values
      for (const [key, props] of Object.entries(SCHEMA.definitions.preferences.properties)) {
        if (!Object.prototype.hasOwnProperty.call(props, "default")) continue;
        if (!Object.prototype.hasOwnProperty.call(state.preferences, key)) {
          state.preferences[key] = props.default;
        } else if (state.preferences[key] === props.default) {
          delete this._preferences[key];
        }
      }
    }

    return this[STORE_STATE_CACHE_KEY];
  }

  get credentialsAccountId() {
    if (this.state.credentials.token) {
      return jwtDecode(this.state.credentials.token).sub;
    } else {
      return null;
    }
  }

  resetConfirmedBroadcastedRooms() {
    this.clearStoredArray("confirmedBroadcastedRooms");
  }

  resetTipActivityFlags() {
    this.update({
      activity: { hasRotated: false, hasPinned: false, hasRecentered: false, hasScaled: false, entryCount: 0 }
    });
  }

  bumpEntryCount() {
    const currentEntryCount = this.state.activity.entryCount || 0;
    this.update({ activity: { entryCount: currentEntryCount + 1 } });
  }

  // Sets a one-time action to perform the next time the page loads
  enqueueOnLoadAction(action, args) {
    this.update({ onLoadActions: [{ action, args }] });
  }

  executeOnLoadActions(sceneEl) {
    for (let i = 0; i < this.state.onLoadActions.length; i++) {
      const { action, args } = this.state.onLoadActions[i];

      if (action === "emit_scene_event") {
        sceneEl.emit(args.event, args.detail);
      }
    }

    this.clearOnLoadActions();
  }

  clearOnLoadActions() {
    this.clearStoredArray("onLoadActions");
  }

  clearStoredArray(key) {
    const overwriteMerge = (destinationArray, sourceArray) => sourceArray;
    const update = {};
    update[key] = [];

    this.update(update, { arrayMerge: overwriteMerge });
  }

  update(newState, mergeOpts) {
    const finalState = merge({ ...this.state, preferences: this._preferences }, newState, mergeOpts);
    const { valid, errors } = validator.validate(finalState, SCHEMA);

    // Cleanup unsupported properties
    if (!valid) {
      errors.forEach(error => {
        console.error(`Removing invalid preference from store: ${error.message}`);
        delete error.instance[error.argument];
      });
    }

    if (newState.preferences) {
      // clear preference if equal to default value so that, when client is updated with different defaults,
      // new defaults will apply without user action
      for (const [key, value] of Object.entries(finalState.preferences)) {
        if (
          SCHEMA.definitions.preferences.properties[key] &&
          Object.prototype.hasOwnProperty.call(SCHEMA.definitions.preferences.properties[key], "default") &&
          value === SCHEMA.definitions.preferences.properties[key].default
        ) {
          delete finalState.preferences[key];
        }
      }
      this._preferences = finalState.preferences;
    }

    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(finalState));
    delete this[STORE_STATE_CACHE_KEY];

    if (newState.profile !== undefined) {
      this.dispatchEvent(new CustomEvent("profilechanged"));
    }
    this.dispatchEvent(new CustomEvent("statechanged"));

    return finalState;
  }

  getEmbedTokenForHub(hub) {
    const embedTokenEntry = this.state.embedTokens.find(embedTokenEntry => embedTokenEntry.hubId === hub.hub_id);
    if (embedTokenEntry) {
      return embedTokenEntry.embedToken;
    } else {
      return null;
    }
  }

  get schema() {
    return SCHEMA;
  }
}
