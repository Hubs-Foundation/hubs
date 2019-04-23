import jwtDecode from "jwt-decode";
import { EventTarget } from "event-target-shim";
import { Presence } from "phoenix";

const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30;

function isSameMonth(da, db) {
  return da.getFullYear() == db.getFullYear() && da.getMonth() == db.getMonth();
}

function isSameDay(da, db) {
  return isSameMonth(da, db) && da.getDate() == db.getDate();
}

export default class HubChannel extends EventTarget {
  constructor(store) {
    super();
    this.store = store;
    this._signedIn = !!this.store.state.credentials.token;
    this._permissions = {};
  }

  get signedIn() {
    return this._signedIn;
  }

  get permissions() {
    return this._permissions;
  }

  setPhoenixChannel = channel => {
    this.channel = channel;
    this.presence = new Presence(channel);
  };

  setPermissionsFromToken = token => {
    // Note: token is not verified.
    this._permissions = jwtDecode(token);

    // Refresh the token 1 minute before it expires.
    const nextRefresh = new Date(this._permissions.exp * 1000 - 60 * 1000) - new Date();
    setTimeout(async () => {
      const result = await this.fetchPermissions();
      this.dispatchEvent(new CustomEvent("permissions-refreshed", { detail: result }));
    }, nextRefresh);
  };

  sendEntryEvent = async () => {
    if (!this.channel) {
      console.warn("No phoenix channel initialized before room entry.");
      return;
    }

    let entryDisplayType = "Screen";

    if (navigator.getVRDisplays) {
      const vrDisplay = (await navigator.getVRDisplays()).find(d => d.isPresenting);

      if (vrDisplay) {
        entryDisplayType = vrDisplay.displayName;
      }
    }

    // This is fairly hacky, but gets the # of initial occupants
    let initialOccupantCount = 0;

    if (NAF.connection.adapter && NAF.connection.adapter.publisher) {
      initialOccupantCount = NAF.connection.adapter.publisher.initialOccupants.length;
    }

    const entryTimingFlags = this.getEntryTimingFlags();

    const entryEvent = {
      ...entryTimingFlags,
      initialOccupantCount,
      entryDisplayType,
      userAgent: navigator.userAgent
    };

    this.channel.push("events:entered", entryEvent);
  };

  getEntryTimingFlags = () => {
    const entryTimingFlags = { isNewDaily: true, isNewMonthly: true, isNewDayWindow: true, isNewMonthWindow: true };
    const storedLastEnteredAt = this.store.state.activity.lastEnteredAt;

    if (!storedLastEnteredAt) {
      return entryTimingFlags;
    }

    const now = new Date();
    const lastEntered = new Date(storedLastEnteredAt);
    const msSinceLastEntered = now - lastEntered;

    // note that new daily and new monthly is based on client local time
    entryTimingFlags.isNewDaily = !isSameDay(now, lastEntered);
    entryTimingFlags.isNewMonthly = !isSameMonth(now, lastEntered);
    entryTimingFlags.isNewDayWindow = msSinceLastEntered > MS_PER_DAY;
    entryTimingFlags.isNewMonthWindow = msSinceLastEntered > MS_PER_MONTH;

    return entryTimingFlags;
  };

  sendObjectSpawnedEvent = objectType => {
    if (!this.channel) {
      console.warn("No phoenix channel initialized before object spawn.");
      return;
    }

    const spawnEvent = {
      object_type: objectType
    };

    this.channel.push("events:object_spawned", spawnEvent);
  };

  sendProfileUpdate = () => {
    this.channel.push("events:profile_updated", { profile: this.store.state.profile });
  };

  updateScene = url => {
    if (!this._permissions.update_hub) return "unauthorized";
    this.channel.push("update_scene", { url });
  };

  rename = name => {
    if (!this._permissions.update_hub) return "unauthorized";
    this.channel.push("update_hub", { name });
  };

  closeHub = () => {
    if (!this._permissions.close_hub) return "unauthorized";
    this.channel.push("close_hub", {});
  };

  subscribe = subscription => {
    this.channel.push("subscribe", { subscription });
  };

  unsubscribe = subscription => {
    return new Promise(resolve => this.channel.push("unsubscribe", { subscription }).receive("ok", resolve));
  };

  sendMessage = (body, type = "chat") => {
    if (!body) return;
    this.channel.push("message", { body, type });
  };

  signIn = token => {
    return new Promise((resolve, reject) => {
      this.channel
        .push("sign_in", { token })
        .receive("ok", ({ perms_token }) => {
          this.setPermissionsFromToken(perms_token);
          this._signedIn = true;
          resolve();
        })
        .receive("error", err => {
          if (err.reason === "invalid_token") {
            console.warn("sign in failed", err);
            // Token expired or invalid TODO purge from storage if possible
            resolve();
          } else {
            console.error("sign in failed", err);
            reject();
          }
        });
    });
  };

  signOut = () => {
    return new Promise((resolve, reject) => {
      this.channel
        .push("sign_out")
        .receive("ok", () => {
          this._permissions = {};
          this._signedIn = false;
          resolve();
        })
        .receive("error", reject);
    });
  };

  getHost = () => {
    return new Promise((resolve, reject) => {
      this.channel
        .push("get_host")
        .receive("ok", res => {
          resolve(res.host);
        })
        .receive("error", reject);
    });
  };

  pin = (id, gltfNode, fileId, fileAccessToken, promotionToken) => {
    const payload = { id, gltf_node: gltfNode };
    if (fileId && promotionToken) {
      payload.file_id = fileId;
      payload.file_access_token = fileAccessToken;
      payload.promotion_token = promotionToken;
    }
    return new Promise((resolve, reject) => {
      this.channel
        .push("pin", payload)
        .receive("ok", resolve)
        .receive("error", reject);
    });
  };

  unpin = (id, fileId) => {
    const payload = { id };
    if (fileId) {
      payload.file_id = fileId;
    }
    this.channel.push("unpin", payload);
  };

  fetchPermissions = () => {
    return new Promise((resolve, reject) => {
      this.channel
        .push("refresh_perms_token")
        .receive("ok", res => {
          this.setPermissionsFromToken(res.perms_token);
          resolve({ permsToken: res.perms_token, permissions: this._permissions });
        })
        .receive("error", reject);
    });
  };

  mute = sessionId => {
    this.channel.push("mute", { session_id: sessionId });
  };

  kick = sessionId => {
    this.channel.push("kick", { session_id: sessionId });
  };

  requestSupport = () => {
    this.channel.push("events:request_support", {});
  };

  disconnect = () => {
    if (this.channel) {
      this.channel.socket.disconnect();
    }
  };
}
