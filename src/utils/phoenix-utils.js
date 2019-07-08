import { Socket } from "phoenix";
import { generateHubName } from "../utils/name-generation";

import Store from "../storage/store";

const resolverLink = document.createElement("a");
export function getReticulumFetchUrl(path, absolute = false) {
  if (process.env.RETICULUM_SERVER) {
    return `https://${process.env.RETICULUM_SERVER}${path}`;
  } else if (absolute) {
    resolverLink.href = path;
    return resolverLink.href;
  } else {
    return path;
  }
}

export async function fetchReticulum(path, absolute = false) {
  const headers = { "Content-Type": "application/json" };
  const credentialsToken = window.APP.store.state.credentials.token;
  if (credentialsToken) headers.authorization = `bearer ${credentialsToken}`;

  const res = await fetch(getReticulumFetchUrl(path, absolute), { method: "GET", headers });

  if (res.status !== 200) {
    console.warn("Reticulum fetch failed " + path);
    return null;
  }

  const body = await res.text();

  let result;
  try {
    result = JSON.parse(body);
  } catch (e) {
    result = body; // TODO better error handling
  }

  return result;
}

let reticulumMeta = null;
let invalidatedReticulumMetaThisSession = false;

export async function invalidateReticulumMeta() {
  invalidatedReticulumMetaThisSession = true;
  reticulumMeta = null;
}

export async function getReticulumMeta() {
  if (!reticulumMeta) {
    // Initially look up version based upon page, avoiding round-trip, otherwise fetch.
    if (!invalidatedReticulumMetaThisSession && document.querySelector("meta[name='ret:version']")) {
      reticulumMeta = {
        version: document.querySelector("meta[name='ret:version']").getAttribute("value"),
        pool: document.querySelector("meta[name='ret:pool']").getAttribute("value"),
        phx_host: document.querySelector("meta[name='ret:phx_host']").getAttribute("value")
      };
    } else {
      await fetch(getReticulumFetchUrl("/api/v1/meta")).then(async res => {
        reticulumMeta = await res.json();
      });
    }
  }

  const qs = new URLSearchParams(location.search);
  const phxHostOverride = qs.get("phx_host");

  if (phxHostOverride) {
    reticulumMeta.phx_host = phxHostOverride;
  }

  return reticulumMeta;
}

export async function connectToReticulum(debug = false, params = null) {
  const qs = new URLSearchParams(location.search);

  const getNewSocketUrl = async () => {
    const socketProtocol = qs.get("phx_protocol") || (document.location.protocol === "https:" ? "wss:" : "ws:");
    let socketHost = qs.get("phx_host");
    let socketPort = qs.get("phx_port");

    const reticulumMeta = await getReticulumMeta();
    socketHost = socketHost || process.env.RETICULUM_SOCKET_SERVER || reticulumMeta.phx_host;
    socketPort =
      socketPort ||
      (process.env.RETICULUM_SERVER ? new URL(`${socketProtocol}//${process.env.RETICULUM_SERVER}`).port : "443");
    return `${socketProtocol}//${socketHost}${socketPort ? `:${socketPort}` : ""}`;
  };

  const socketUrl = await getNewSocketUrl();
  console.log(`Phoenix Socket URL: ${socketUrl}`);

  const socketSettings = {};

  if (debug) {
    socketSettings.logger = (kind, msg, data) => {
      console.log(`${kind}: ${msg}`, data);
    };
  }

  if (params) {
    socketSettings.params = params;
  }

  const socket = new Socket(`${socketUrl}/socket`, socketSettings);
  socket.connect();
  socket.onError(async () => {
    // On error, underlying reticulum node may have died, so rebalance by
    // fetching a new healthy node to connect to.
    invalidateReticulumMeta();

    const endPointPath = new URL(socket.endPoint).pathname;
    const newSocketUrl = await getNewSocketUrl();
    const newEndPoint = `${newSocketUrl}${endPointPath}`;
    console.log(`Socket error, changed endpoint to ${newEndPoint}`);
    socket.endPoint = newEndPoint;
  });

  return socket;
}

export function getLandingPageForPhoto(photoUrl) {
  const parsedUrl = new URL(photoUrl);
  return getReticulumFetchUrl(parsedUrl.pathname.replace(".png", ".html") + parsedUrl.search, true);
}

export function fetchReticulumAuthenticated(url, method = "GET", payload) {
  const { token } = window.APP.store.state.credentials;
  const retUrl = getReticulumFetchUrl(url);
  const params = {
    headers: { "content-type": "application/json" },
    method
  };
  if (token) {
    params.headers.authorization = `bearer ${token}`;
  }
  if (payload) {
    params.body = JSON.stringify(payload);
  }
  return fetch(retUrl, params).then(async r => {
    const result = await r.text();
    try {
      return JSON.parse(result);
    } catch (e) {
      // Some reticulum responses, particularly DELETE requests, don't return json.
      return result;
    }
  });
}

export async function createAndRedirectToNewHub(name, sceneId, sceneUrl, replace) {
  const createUrl = getReticulumFetchUrl("/api/v1/hubs");
  const payload = { hub: { name: name || generateHubName() } };

  if (sceneId) {
    payload.hub.scene_id = sceneId;
  } else {
    payload.hub.default_environment_gltf_bundle_url = sceneUrl;
  }

  const headers = { "content-type": "application/json" };
  const store = new Store();
  if (store.state && store.state.credentials.token) {
    headers.authorization = `bearer ${store.state.credentials.token}`;
  }

  let res = await fetch(createUrl, {
    body: JSON.stringify(payload),
    headers,
    method: "POST"
  }).then(r => r.json());

  if (res.error === "invalid_token") {
    // Clear the invalid token from store.
    store.update({ credentials: { token: null, email: null } });

    // Create hub anonymously
    delete headers.authorization;
    res = await fetch(createUrl, {
      body: JSON.stringify(payload),
      headers,
      method: "POST"
    }).then(r => r.json());
  }

  const hub = res;
  let url = hub.url;

  const creatorAssignmentToken = hub.creator_assignment_token;
  if (creatorAssignmentToken) {
    store.update({ creatorAssignmentTokens: [{ hubId: hub.hub_id, creatorAssignmentToken: creatorAssignmentToken }] });

    // Don't need to store the embed token if there's no creator assignment token, since that means
    // we are the owner and will get the embed token on page load.
    const embedToken = hub.embed_token;

    if (embedToken) {
      store.update({ embedTokens: [{ hubId: hub.hub_id, embedToken: embedToken }] });
    }
  }

  if (process.env.RETICULUM_SERVER && document.location.host !== process.env.RETICULUM_SERVER) {
    url = `/hub.html?hub_id=${hub.hub_id}`;
  }

  if (replace) {
    document.location.replace(url);
  } else {
    document.location = url;
  }
}

export function getPresenceProfileForSession(presences, sessionId) {
  const entry = Object.entries(presences || {}).find(([k]) => k === sessionId) || [];
  const presence = entry[1];
  return (presence && presence.metas && presence.metas[0].profile) || {};
}

// Takes the given channel, and creates a new channel with the same bindings
// with the given socket, joins it, and leaves the old channel after joining.
//
// NOTE: This function relies upon phoenix channel object internals, so this
// function will need to be reviewed if/when we ever update phoenix.js
export function migrateChannelToSocket(oldChannel, socket, params) {
  const channel = socket.channel(oldChannel.topic, params || oldChannel.params);

  for (let i = 0, l = oldChannel.bindings.length; i < l; i++) {
    const item = oldChannel.bindings[i];
    channel.on(item.event, item.callback);
  }

  for (let i = 0, l = oldChannel.pushBuffer.length; i < l; i++) {
    const item = oldChannel.pushBuffer[i];
    channel.push(item.event, item.payload, item.timeout);
  }

  const oldJoinPush = oldChannel.joinPush;
  const joinPush = channel.join();

  for (let i = 0, l = oldJoinPush.recHooks.length; i < l; i++) {
    const item = oldJoinPush.recHooks[i];
    joinPush.receive(item.status, item.callback);
  }

  return new Promise(resolve => {
    joinPush.receive("ok", () => {
      // Clear all event handlers first so no duplicate messages come in.
      oldChannel.bindings = [];
      resolve(channel);
    });
  });
}
