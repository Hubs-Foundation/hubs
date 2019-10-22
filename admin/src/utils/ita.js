import Store from "hubs/src/storage/store";
import configs from "./configs";

const store = new Store();
const serviceNames = configs.CONFIGURABLE_SERVICES.split(",");

function getServiceDisplayName(service) {
  switch (service) {
    case "janus-gateway":
      return "Janus";
    case "reticulum":
      return "Reticulum";
    case "ita":
      return "Ita";
    case "app-config":
      return "App Config";
    default:
      return null;
  }
}

function getEndpoint(path) {
  return `${configs.ITA_SERVER}/api/ita/${path}`;
}

function getSchemas() {
  return fetch(
    getEndpoint("schemas"),
    { headers: { Authorization: `Bearer ${store.state.credentials.token}` } }
  ).then(resp => resp.json());
}

function getConfig(service) {
  return fetch(getEndpoint(`configs/${service}/ps`)).then(resp => resp.json());
}

function putConfig(service, config) {
  console.log(config);
  const req = new Request(getEndpoint(`configs/${service}`), {
    method: "POST",
    body: JSON.stringify(config)
  });
  return fetch(req).then(resp => resp.json());
}

// An object is considered to be a config descriptor if it at least has
// a "type" key and has no keys which aren't valid descriptor metadata.
const DESCRIPTOR_FIELDS = ["default", "type", "of"];
function isDescriptor(obj) {
  if (typeof obj !== "object") return false;
  if (!("type" in obj)) return false;
  for (const k in obj) {
    if (!DESCRIPTOR_FIELDS.includes(k)) {
      return false;
    }
  }
  return true;
}

function getConfigValue(config, path) {
  let obj = config;
  for (const p of path) {
    if (p in obj) {
      obj = obj[p]; // go down one level
    } else {
      obj = undefined; // the configuration for this value is empty; we can stop
      break;
    }
  }
  return obj;
}

function setConfigValue(config, path, val) {
  let obj = config;
  for (const p of path.slice(0, -1)) {
    if (p in obj) {
      obj = obj[p]; // go down one level
    } else {
      obj = obj[p] = {}; // the configuration for this value is empty; keep creating new objects going down
    }
  }
  obj[path.slice(-1)] = val;
}

export {
  serviceNames,
  isDescriptor,
  getServiceDisplayName,
  getSchemas,
  getConfig,
  putConfig,
  getConfigValue,
  setConfigValue
};
