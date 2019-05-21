import { Validator } from "jsonschema";
import merge from "deepmerge";
import Cookies from "js-cookie";
import jwtDecode from "jwt-decode";

const LOCAL_STORE_KEY = "___hubs_store";
const STORE_STATE_CACHE_KEY = Symbol();
const OAUTH_FLOW_CREDENTIALS_KEY = "ret-oauth-flow-account-credentials";
const validator = new Validator();
import { EventTarget } from "event-target-shim";
import { generateDefaultProfile, generateRandomName } from "../utils/identity.js";

// Durable (via local-storage) schema-enforced state that is meant to be consumed via forward data flow.
// (Think flux but with way less incidental complexity, at least for now :))
export const SCHEMA = {
  id: "/HubsStore",

  definitions: {
    profile: {
      type: "object",
      additionalProperties: false,
      properties: {
        displayName: { type: "string", pattern: "^[A-Za-z0-9-]{3,32}$" },
        avatarId: { type: "string" },
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
        hasChangedName: { type: "boolean" },
        hasAcceptedProfile: { type: "boolean" },
        lastEnteredAt: { type: "string" },
        hasPinned: { type: "boolean" },
        hasRotated: { type: "boolean" },
        hasRecentered: { type: "boolean" },
        hasScaled: { type: "boolean" },
        hasHoveredInWorldHud: { type: "boolean" }
      }
    },

    settings: {
      type: "object",
      additionalProperties: false,
      properties: {
        lastUsedMicDeviceId: { type: "string" }
      }
    },

    confirmedDiscordRooms: {
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
    }
  },

  type: "object",

  properties: {
    profile: { $ref: "#/definitions/profile" },
    credentials: { $ref: "#/definitions/credentials" },
    activity: { $ref: "#/definitions/activity" },
    settings: { $ref: "#/definitions/settings" },
    confirmedDiscordRooms: { $ref: "#/definitions/confirmedDiscordRooms" },
    uploadPromotionTokens: { $ref: "#/definitions/uploadPromotionTokens" },
    creatorAssignmentTokens: { $ref: "#/definitions/creatorAssignmentTokens" }
  },

  additionalProperties: false
};

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
      uploadPromotionTokens: [],
      creatorAssignmentTokens: []
    });

    const oauthFlowCredentials = Cookies.getJSON(OAUTH_FLOW_CREDENTIALS_KEY);
    if (oauthFlowCredentials) {
      this.update({ credentials: oauthFlowCredentials });
      this.resetToRandomLegacyAvatar();
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

  resetToRandomLegacyAvatar = () => {
    this.update({
      profile: { ...(this.state.profile || {}), ...generateDefaultProfile() }
    });
  };

  get state() {
    if (!this.hasOwnProperty(STORE_STATE_CACHE_KEY)) {
      this[STORE_STATE_CACHE_KEY] = JSON.parse(localStorage.getItem(LOCAL_STORE_KEY));
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
    const { valid } = validator.validate(finalState, SCHEMA);

    if (!valid) {
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
