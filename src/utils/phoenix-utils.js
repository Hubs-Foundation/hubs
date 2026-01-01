import { Socket } from "phoenix";
import { generateHubName } from "../utils/name-generation";
import configs from "../utils/configs";
import { sleep } from "../utils/async-utils";
import { store } from "../utils/store-instance";

export function hasReticulumServer() {
  return !!configs.RETICULUM_SERVER;
}

export function isLocalClient() {
  return hasReticulumServer() && document.location.host !== configs.RETICULUM_SERVER;
}

export function hubUrl(hubId, extraParams, slug, waypoint) {
  if (!hubId) {
    if (isLocalClient()) {
      hubId = new URLSearchParams(location.search).get("hub_id");
    } else {
      hubId = location.pathname.split("/")[1];
    }
  }

  let url;
  if (isLocalClient()) {
    url = new URL(`/hub.html`, location.href);
    url.searchParams.set("hub_id", hubId);
  } else {
    const maybeSlug = slug ? `/${slug}` : "";
    url = new URL(`/${hubId}${maybeSlug}`, location.href);
  }

  for (const key in extraParams) {
    if (Object.prototype.hasOwnProperty.call(extraParams, key)) {
      url.searchParams.set(key, extraParams[key]);
    }
  }

  if (waypoint) {
    url.hash = waypoint;
  }

  return url;
}

const resolverLink = document.createElement("a");
let reticulumMeta = null;
let invalidatedReticulumMetaThisSession = false;

export function getReticulumFetchUrl(path, absolute = false, host = null, port = null) {
  if (host || hasReticulumServer()) {
    return `https://${host || configs.RETICULUM_SERVER}${port ? `:${port}` : ""}${path}`;
  } else if (absolute) {
    resolverLink.href = path;
    return resolverLink.href;
  } else {
    return path;
  }
}

export function getUploadsUrl(path, absolute = false, host = null, port = null) {
  // If the Hubs Cloud stack is configured to use Cloudflare, we need to ignore the configured UPLOADS_HOST
  // since reticulum will only serve uploads via the Cloudflare worker. BASE_ASSETS_PATH will have been
  // correctly configured to use the Cloudflare worker, though we only need the hostname,
  // not the full assets URL.
  const isUsingCloudflare = configs.BASE_ASSETS_PATH.includes("workers.dev");
  const uploadsHost = isUsingCloudflare ? new URL(configs.BASE_ASSETS_PATH).hostname : configs.UPLOADS_HOST;
  return uploadsHost
    ? `https://${uploadsHost}${port ? `:${port}` : ""}${path}`
    : getReticulumFetchUrl(path, absolute, host, port);
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

let directReticulumHostAndPort;

async function refreshDirectReticulumHostAndPort() {
  const qs = new URLSearchParams(location.search);
  let host = qs.get("phx_host");
  const reticulumMeta = await getReticulumMeta();
  host = host || configs.RETICULUM_SOCKET_SERVER || reticulumMeta.phx_host;
  const port =
    qs.get("phx_port") ||
    (hasReticulumServer() ? new URL(`${document.location.protocol}//${configs.RETICULUM_SERVER}`).port : "443");
  directReticulumHostAndPort = { host, port };
}

export function getDirectReticulumFetchUrl(path, absolute = false) {
  if (!directReticulumHostAndPort) {
    console.warn("Cannot call getDirectReticulumFetchUrl before connectToReticulum. Returning non-direct url.");
    return getReticulumFetchUrl(path, absolute);
  }

  const { host, port } = directReticulumHostAndPort;
  return getReticulumFetchUrl(path, absolute, host, port);
}

export async function invalidateReticulumMeta() {
  invalidatedReticulumMetaThisSession = true;
  reticulumMeta = null;
}

export async function connectToReticulum(debug = false, params = null, socketClass = Socket) {
  const qs = new URLSearchParams(location.search);

  const getNewSocketUrl = async () => {
    await refreshDirectReticulumHostAndPort();
    const { host, port } = directReticulumHostAndPort;
    const protocol =
      qs.get("phx_protocol") ||
      configs.RETICULUM_SOCKET_PROTOCOL ||
      (document.location.protocol === "https:" ? "wss:" : "ws:");

    return `${protocol}//${host}${port ? `:${port}` : ""}`;
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

  const socket = new socketClass(`${socketUrl}/socket`, socketSettings);
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

// (reserved) small data URL helper kept for future placeholders

function assetUrl(relPath) {
  // served by devServer middleware added in webpack.config.js
  return `${location.origin}/dev-assets/${relPath}`;
}

function buildFallbackMediaEntries(source) {
  const previewImage = {
    type: "image",
    url: assetUrl("background.jpg"),
    width: 1280,
    height: 720
  };
  const previewVideo = {
    type: "mp4",
    url: assetUrl("video/home.mp4"),
    width: 1280,
    height: 720
  };

  if (source === "rooms") {
    return Array.from({ length: 6 }).map((_, i) => ({
      type: "room",
      id: `local-room-${i + 1}`,
      name: `Local Demo Room ${i + 1}`,
      url: `/hub.html?hub_id=local-demo-${i + 1}`,
      member_count: Math.floor(Math.random() * 5),
      images: { preview: i % 2 ? previewVideo : previewImage }
    }));
  }

  if (source === "scene_listings" || source === "scenes") {
    return Array.from({ length: 4 }).map((_, i) => ({
      type: "scene_listing",
      id: `local-scene-${i + 1}`,
      name: `Local Demo Scene ${i + 1}`,
      url: `#`,
      allow_remixing: false,
      images: { preview: previewImage }
    }));
  }

  if (source === "avatar_listings" || source === "avatars") {
    return Array.from({ length: 4 }).map((_, i) => ({
      type: source === "avatars" ? "avatar" : "avatar_listing",
      id: `local-avatar-${i + 1}`,
      name: `Local Demo Avatar ${i + 1}`,
      url: `#`,
      images: { preview: { ...previewImage, height: 1024, width: 768 } },
      gltfs: {
        base: assetUrl("models/DefaultAvatar.glb"),
        avatar: assetUrl("models/DefaultAvatar.glb")
      }
    }));
  }

  return [];
}

export function fetchReticulumAuthenticatedWithToken(token, url, method = "GET", payload) {
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

  const tryParse = async text => {
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  // Local-dev short-circuit: provide stubs without issuing a network request
  try {
    if (process.env.RETICULUM_SERVER) {
      const u = new URL(url, location.origin);
      // Media search stubs (rooms, scenes, avatars)
      if (u.pathname === "/api/v1/media/search") {
        const source = u.searchParams.get("source") || "";
        return Promise.resolve({
          entries: buildFallbackMediaEntries(source),
          meta: { next_cursor: null },
          suggestions: []
        });
      }
      // Meta stub used by admin for initial page load
      if (u.pathname === "/api/v1/meta") {
        return Promise.resolve({
          version: "local-stub",
          pool: "dev",
          phx_host: "hubs.local",
          phx_port: "4000",
          repo: {
            accounts: { any: true, admin: true },
            storage: { in_quota: true },
            scene_listings: { any: true, default: true, featured: false },
            avatar_listings: { any: true, base: true, default: true, featured: false }
          }
        });
      }
      // Avatar details stub
      if (u.pathname.startsWith("/api/v1/avatars")) {
        if (method === "GET") {
          const parts = u.pathname.split("/");
          const id = parts[parts.length - 1] || "local-avatar";
          const thumb = assetUrl("background.jpg");
          const gltf = assetUrl("models/DefaultAvatar.glb");
          return Promise.resolve({
            avatars: [
              {
                avatar_id: id,
                name: `Local Avatar ${id}`,
                files: { thumbnail: thumb },
                base_gltf_url: gltf,
                gltf_url: gltf,
                attributions: { creator: "Local" }
              }
            ]
          });
        } else if (method === "POST") {
          return Promise.resolve({ ok: true });
        }
      }
    }
  } catch {
    // ignore URL parse issues in dev stub check
  }

  return fetch(retUrl, params)
    .then(async r => {
      const result = await r.text();
      return tryParse(result);
    })
    .catch(err => {
      // In local development, if the configured server is unreachable or CORS fails,
      // provide minimal stub responses so the UI can render for visual inspection.
      if (process.env.RETICULUM_SERVER) {
        const u = new URL(url, location.origin);
        if (u.pathname === "/api/v1/media/search") {
          const source = u.searchParams.get("source") || "";
          return {
            entries: buildFallbackMediaEntries(source),
            meta: { next_cursor: null },
            suggestions: []
          };
        }
      }
      console.warn("fetchReticulumAuthenticated fallback due to error:", err);
      // Generic empty fallback
      return { entries: [], meta: { next_cursor: null }, suggestions: [] };
    });
}
export function fetchReticulumAuthenticated(url, method = "GET", payload) {
  return fetchReticulumAuthenticatedWithToken(store.state.credentials.token, url, method, payload);
}

export async function createAndRedirectToNewHub(name, sceneId, replace, qs) {
  const createUrl = getReticulumFetchUrl("/api/v1/hubs");
  const payload = { hub: { name: name || generateHubName() } };

  if (sceneId) {
    payload.hub.scene_id = sceneId;
  }

  const headers = { "content-type": "application/json" };
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

  if (isLocalClient()) {
    url = `/hub.html?hub_id=${hub.hub_id}`;
  }

  if (qs) {
    if (isLocalClient()) {
      url = `${url}&${qs.toString()}`;
    } else {
      url = `${url}?${qs.toString()}`;
    }
  }

  if (replace) {
    document.location.replace(url);
  } else {
    document.location = url;
  }
}

export function getPresenceEntryForSession(presences, sessionId) {
  const entry = Object.entries(presences || {}).find(([k]) => k === sessionId) || [];
  const presence = entry[1];
  return (presence && presence.metas && presence.metas[0]) || {};
}

export function getPresenceContextForSession(presences, sessionId) {
  return (getPresenceEntryForSession(presences, sessionId) || {}).context || {};
}

export function getPresenceProfileForSession(presences, sessionId) {
  return (getPresenceEntryForSession(presences, sessionId) || {}).profile || {};
}

function migrateBindings(oldChannel, newChannel) {
  const doNotDuplicate = ["phx_close", "phx_error", "phx_reply", "presence_state", "presence_diff"];
  const shouldDuplicate = event => {
    return !event.startsWith("chan_reply_") && !doNotDuplicate.includes(event);
  };
  for (let i = 0, l = oldChannel.bindings.length; i < l; i++) {
    const item = oldChannel.bindings[i];
    if (shouldDuplicate(item.event)) {
      newChannel.bindings.push(item);
    }
  }
  newChannel.bindingRef = oldChannel.bindingRef;
}

// Takes the given channel, and creates a new channel with the same bindings
// with the given socket, joins it, and leaves the old channel after joining.
//
// NOTE: This function relies upon phoenix channel object internals, so this
// function will need to be reviewed if/when we ever update phoenix.js
export function migrateChannelToSocket(oldChannel, socket, params) {
  const channel = socket.channel(oldChannel.topic, params || oldChannel.params);

  migrateBindings(oldChannel, channel);

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

export function migrateToChannel(oldChannel, newChannel) {
  migrateBindings(oldChannel, newChannel);

  return new Promise((resolve, reject) => {
    newChannel
      .join()
      .receive("ok", data => {
        oldChannel.leave();
        oldChannel.bindings = [];
        resolve(data);
      })
      .receive("error", data => {
        newChannel.leave();
        reject(data);
      });
  });
}

export function discordBridgesForPresences(presences) {
  const channels = [];
  for (const p of Object.values(presences)) {
    for (const m of p.metas) {
      if (m.profile && m.profile.discordBridges) {
        Array.prototype.push.apply(
          channels,
          m.profile.discordBridges.map(b => b.channel.name)
        );
      }
    }
  }
  return channels;
}

export function hasEmbedPresences(presences) {
  for (const p of Object.values(presences)) {
    for (const m of p.metas) {
      if (m.context && m.context.embed) {
        return true;
      }
    }
  }

  return false;
}

export function denoisePresence({ onJoin, onLeave, onChange }) {
  return {
    rawOnJoin: (key, beforeJoin, afterJoin) => {
      if (beforeJoin === undefined) {
        onJoin(key, afterJoin.metas[0]);
      }
    },
    rawOnLeave: (key, remaining, removed) => {
      if (remaining.metas.length === 0) {
        onLeave(key, removed.metas[0]);
      } else {
        onChange(key, removed.metas[removed.metas.length - 1], remaining.metas[remaining.metas.length - 1]);
      }
    }
  };
}

export function presenceEventsForHub(events) {
  const onJoin = (key, meta) => {
    events.trigger(`hub:join`, { key, meta });
  };
  const onLeave = (key, meta) => {
    events.trigger(`hub:leave`, { key, meta });
  };
  const onChange = (key, previous, current) => {
    events.trigger(`hub:change`, { key, previous, current });
  };
  return {
    onJoin,
    onLeave,
    onChange
  };
}

export const tryGetMatchingMeta = async ({ ret_pool, ret_version }, shouldAbandonMigration) => {
  const backoffMS = 5000;
  const randomMS = 15000;
  const maxAttempts = 10;
  let didMatchMeta = false;
  let attempt = 0;
  while (!didMatchMeta && attempt < maxAttempts && !shouldAbandonMigration()) {
    try {
      // Add randomness to the first request avoid flooding reticulum.
      const delayMS = attempt * backoffMS + (attempt === 0 ? Math.random() * randomMS : 0);
      console.log(
        `[reconnect] Getting reticulum meta in ${Math.ceil(delayMS / 1000)} seconds.${
          attempt ? ` (Attempt ${attempt + 1} of ${maxAttempts})` : ""
        }`
      );
      await sleep(delayMS);
      invalidateReticulumMeta();
      console.log(`[reconnect] Getting reticulum meta.${attempt ? ` (Attempt ${attempt + 1} of ${maxAttempts})` : ""}`);
      const { pool, version } = await getReticulumMeta();
      didMatchMeta = ret_pool === pool && ret_version === version;
    } catch {
      didMatchMeta = false;
    }

    attempt = attempt + 1;
  }
  return didMatchMeta;
};

window.$P = {
  getReticulumFetchUrl
};
