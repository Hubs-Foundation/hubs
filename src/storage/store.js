import merge from "deepmerge";
import Cookies from "js-cookie";

const LOCAL_STORE_KEY = "___hubs_store";
const STORE_STATE_CACHE_KEY = Symbol();
const OAUTH_FLOW_CREDENTIALS_KEY = "ret-oauth-flow-account-credentials";
import { EventTarget } from "event-target-shim";
import { generateDefaultProfile, generateRandomName } from "../utils/identity.js";

function isString(value) {
  return typeof value === "string" || value instanceof String;
}

function isBoolean(value) {
  return typeof value === "boolean" || value instanceof Boolean;
}

// Durable (via local-storage) schema-enforced state that is meant to be consumed via forward data flow.
// (Think flux but with way less incidental complexity, at least for now :))
export const SCHEMA = {
  profile: {
    displayName: isString,
    avatarId: isString,
    personalAvatarId: isString
  },
  credentials: {
    token: isString,
    email: isString
  },
  activity: {
    hasFoundFreeze: isBoolean,
    hasChangedName: isBoolean,
    lastEnteredAt: isString,
    hasPinned: isBoolean,
    hasRotated: isBoolean,
    hasRecentered: isBoolean,
    hasScaled: isBoolean,
    hasHoveredInWorldHud: isBoolean
  },
  settings: {
    lastUsedMicDeviceId: isString
  },
  confirmedDiscordRooms: [isString],
  uploadPromotionTokens: [{ fileId: isString, promotionToken: isString }]
};

function validate(obj, schema) {
  if (Array.isArray(schema)) {
    if (!Array.isArray(obj)) {
      throw new Error(`Required array, found ${obj}.`);
    }
    const itemSchema = schema[0];
    for (const val of obj) {
      validate(val, itemSchema);
    }
  } else if (typeof schema === "object") {
    if (!(typeof obj === "object" && obj !== null)) {
      throw new Error(`Required object, found ${obj}.`);
    }
    for (const key in schema) {
      validate(obj[key], schema[key]);
    }
  } else if (obj != null && !schema(obj)) {
    throw new Error(`Invalid value for schema: ${obj}.`);
  }
}

export default class Store extends EventTarget {
  constructor() {
    super();

    if (localStorage.getItem(LOCAL_STORE_KEY) === null) {
      localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify({}));
    }
    this.update({
      activity: {},
      settings: {},
      credentials: {},
      profile: {},
      confirmedDiscordRooms: [],
      uploadPromotionTokens: []
    });

    const oauthFlowCredentials = Cookies.getJSON(OAUTH_FLOW_CREDENTIALS_KEY);
    if (oauthFlowCredentials) {
      this.update({ credentials: oauthFlowCredentials });
      Cookies.remove(OAUTH_FLOW_CREDENTIALS_KEY);
    }
  }

  // Initializes store with any default bits
  init = () => {
    this.update({
      profile: { ...generateDefaultProfile(), ...(this.state.profile || {}) }
    });

    // Regenerate name to encourage users to change it.
    if (!this.state.activity.hasChangedName) {
      this.update({ profile: { displayName: generateRandomName() } });
    }
  };

  get state() {
    if (!this.hasOwnProperty(STORE_STATE_CACHE_KEY)) {
      this[STORE_STATE_CACHE_KEY] = JSON.parse(localStorage.getItem(LOCAL_STORE_KEY));
    }

    return this[STORE_STATE_CACHE_KEY];
  }

  resetConfirmedDiscordRooms() {
    // merge causing us some annoyance here :(
    const overwriteMerge = (destinationArray, sourceArray) => sourceArray;
    this.update({ confirmedDiscordRooms: [] }, { arrayMerge: overwriteMerge });
  }

  resetTipActivityFlags() {
    this.update({ activity: { hasRotated: false, hasPinned: false, hasRecentered: false, hasScaled: false } });
  }

  update(newState, mergeOpts) {
    const finalState = merge(this.state, newState, mergeOpts);

    try {
      validate(finalState, SCHEMA);
    } catch (e) {
      // Intentionally not including details about the state or validation result here, since we don't want to leak
      // sensitive data in the error message.
      throw new Error(`Write to store failed schema validation.`);
    }

    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(finalState));
    delete this[STORE_STATE_CACHE_KEY];

    this.dispatchEvent(new CustomEvent("statechanged"));

    return finalState;
  }
}
