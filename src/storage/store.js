import { Validator } from "jsonschema";
import { merge } from "lodash";

const LOCAL_STORE_KEY = "___hubs_store";
const STORE_STATE_CACHE_KEY = Symbol();
const validator = new Validator();
import { EventTarget } from "event-target-shim";

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
        avatarId: { type: "string" }
      }
    },

    activity: {
      type: "object",
      additionalProperties: false,
      properties: {
        hasChangedName: { type: "boolean" },
        lastEnteredAt: { type: "string" },
        showedMailingListInterstitial: { type: "boolean" }
      }
    },

    settings: {
      type: "object",
      additionalProperties: false,
      properties: {
        lastUsedMicDeviceId: { type: "string" }
      }
    }
  },

  type: "object",

  properties: {
    profile: { $ref: "#/definitions/profile" },
    activity: { $ref: "#/definitions/activity" },
    settings: { $ref: "#/definitions/settings" }
  },

  additionalProperties: false
};

export default class Store extends EventTarget {
  constructor() {
    super();

    if (localStorage.getItem(LOCAL_STORE_KEY) === null) {
      localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify({}));
    }
  }

  get state() {
    if (!this.hasOwnProperty(STORE_STATE_CACHE_KEY)) {
      this[STORE_STATE_CACHE_KEY] = JSON.parse(localStorage.getItem(LOCAL_STORE_KEY));
    }

    return this[STORE_STATE_CACHE_KEY];
  }

  update(newState) {
    const finalState = merge(this.state, newState);
    const isValid = validator.validate(finalState, SCHEMA).valid;

    if (!isValid) {
      throw new Error(`Write of ${JSON.stringify(finalState)} to store failed schema validation.`);
    }

    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(finalState));
    delete this[STORE_STATE_CACHE_KEY];

    this.dispatchEvent(new CustomEvent("statechanged"));

    return finalState;
  }
}
