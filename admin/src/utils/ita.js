const serviceNames = process.env.CONFIGURABLE_SERVICES.split(",");

function getServiceDisplayName(service) {
  switch (service) {
  case "janus-gateway": return "Janus";
  case "reticulum": return "Reticulum";
  case "ita": return "Ita";
  default: return null;
  }
}

function getEndpoint(path) {
  return `${process.env.ITA_SERVER}/${path}`;
}

function getSchemas() {
  return fetch(getEndpoint("schemas")).then(resp => resp.json());
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
    if (p in obj) { // go down one level
      obj = obj[p];
    } else { // the configuration for this value is empty; we can stop
      obj = undefined;
      break;
    }
  }
  return obj;
}

function setConfigValue(config, path, val) {
  let obj = config;
  for (const p of path.slice(0, -1)) {
    if (p in obj) { // go down one level
      obj = obj[p];
    } else { // the configuration for this value is empty; keep creating new objects going down
      obj = obj[p] = {};
    }
  }
  return obj[path.slice(-1)] = val;
}

function getDefaultValue(descriptor) {
  if ("default" in descriptor) {
    return descriptor.default;
  } else {
    return undefined;
  }
}

// Given the schema and the path to a config, returns a valid empty value for the type of the descriptor if one is present.
function getEmptyValue(schema, section, config) {
  if (!schema[section]) return "";

  const descriptor = schema[section][config];
  if (!descriptor) return "";
  if (!("type" in descriptor)) return "";
  if (descriptor.type === "number") return 0;
  return "";
}

// Given the schema and the path to a config, coerces the value to the type of the descriptor if one is present.
function coerceToType(schema, section, config, value) {
  if (!schema[section]) return value;
  const descriptor = schema[section][config];
  if (!descriptor || !("type" in descriptor)) return value;
  if (descriptor.type === "number" && value) return parseInt(value);
  return value;
}

function getDescriptors(schema) {
  const config = {};
  for (const k in schema) {
    const v = schema[k];
    if (typeof v === "object") {
      // it's either a descriptor, or a subtree of descriptors
      if (isDescriptor(v)) {
        const defaultValue = getDefaultValue(v);
        if (defaultValue !== undefined) {
          config[k] = defaultValue;
        }
      } else {
        config[k] = getDefaults(v);
      }
    } else {
      // schemas should only be a tree of descriptors!
      throw new Error(`Schema contains invalid field ${k} = ${v}.`);
    }
  }
  return config;
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
}
