import uuid from "uuid/v4";
import { Validator } from "jsonschema";

const LOCAL_STORE_KEY = "___mozilla_duck";
const STORE_STATE_CACHE_KEY = Symbol();
const validator = new Validator();

// Durable (via local-storage) schema-enforced state that is meant to be consumed via forward data flow.
// (Think flux but with way less incidental complexity, at least for now :))
export const SCHEMA = {
  id: "/MozillaDuckStore",

  definitions: {
    profile: {
      type: "object",
      additionalProperties: false,
      properties: {
        display_name: { type: "string", pattern: "^[A-Za-z0-9-]{3,32}$" },
      }
    }
  },

  type: "object",

  properties: {
    id: { type: "string", pattern: "^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$" },
    profile: { "$ref": "#/definitions/profile" },
  },

  additionalProperties: false
}

export default class Store {
  subscribers = new Set();

  constructor() {
    if (localStorage.getItem(LOCAL_STORE_KEY) === null) {
      localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify({ id: uuid() }));
    }
  }

  get state() {
    if (!this.hasOwnProperty(STORE_STATE_CACHE_KEY)) {
      this[STORE_STATE_CACHE_KEY] = JSON.parse(localStorage.getItem(LOCAL_STORE_KEY));
    }

    return this[STORE_STATE_CACHE_KEY];
  }

  subscribe(subscriber) {
    this.subscribers.add(subscriber);
  }

  unsubscribe(subscriber) {
    this.subscribers.delete(subscriber);
  }

  update(newState) {
    if (newState.id) {
      console.error("Store id is immutable.");
      return;
    }

    const finalState = { ...this.state, ...newState };
    const isValid = validator.validate(finalState, SCHEMA).valid;

    if (!isValid) {
      console.warn(`Write of ${JSON.stringify(finalState)} to store failed schema validation.`)
      return;
    }

    localStorage.setItem(LOCAL_STORE_KEY, JSON.stringify(finalState));
    delete this[STORE_STATE_CACHE_KEY];

    for (const subscriber of this.subscribers) {
      subscriber();
    }

    return finalState;
  }
}
