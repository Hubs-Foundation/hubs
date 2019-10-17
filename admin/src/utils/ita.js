import configs from "./configs";

const schemaCategories = ["api_keys", "content", "email", "advanced"];
const namesForSchemaCategories = {
  api_keys: "API Keys",
  content: "Content",
  email: "Email",
  advanced: "Advanced"
};

const serviceNames = configs.CONFIGURABLE_SERVICES.split(",");
let currentAuthToken = null;

const setAuthToken = function(token) {
  currentAuthToken = token;
};

function getServiceDisplayName(service) {
  switch (service) {
    case "janus-gateway":
      return "Janus";
    case "reticulum":
      return "Reticulum";
    case "ita":
      return "Ita";
    default:
      return null;
  }
}

function getEndpoint(path) {
  if (configs.ITA_SERVER) {
    return `${configs.ITA_SERVER}/${path}`;
  } else {
    return `/api/ita/${path}`;
  }
}

function fetchWithAuth(req) {
  const options = {};
  options.headers = new Headers();
  options.headers.set("Authorization", `Bearer ${currentAuthToken}`);
  return fetch(req, options);
}

function getSchemas() {
  return fetchWithAuth(getEndpoint("schemas")).then(resp => resp.json());
}

function getConfig(service) {
  return fetchWithAuth(getEndpoint(`configs/${service}/ps`)).then(resp => resp.json());
}

function putConfig(service, config) {
  const req = new Request(getEndpoint(`configs/${service}`), {
    method: "POST",
    body: JSON.stringify(config)
  });
  return fetchWithAuth(req).then(resp => resp.json());
}

// An object is considered to be a config descriptor if it at least has
// a "type" key and has no keys which aren't valid descriptor metadata.
const DESCRIPTOR_FIELDS = ["default", "type", "of", "unmanaged", "category", "name", "description"];
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

// Returns a map keyed by category that contains all the configs in that category.
const schemaByCategories = schema => {
  const o = {};

  for (const cat of schemaCategories) {
    o[cat] = JSON.parse(JSON.stringify(schema)); // Cheap copy

    // Walk the schema copy, removing any elements not in the category
    for (const svc in o[cat]) {
      for (const f in o[cat][svc]) {
        for (const g in o[cat][svc][f]) {
          const v = o[cat][svc][f][g];
          if (isDescriptor(v)) {
            if (v.category !== cat) {
              delete o[cat][svc][f][g];

              if (Object.keys(o[cat][svc][f]).length === 0) {
                delete o[cat][svc][f];
              }
            }
          } else {
            for (const h in v) {
              if (v[h].category !== cat) {
                delete v[h];

                if (Object.keys(o[cat][svc][f][g]).length === 0) {
                  delete o[cat][svc][f][g];
                }

                if (Object.keys(o[cat][svc][f]).length === 0) {
                  delete o[cat][svc][f];
                }
              }
            }
          }
        }
      }

      if (Object.keys(o[cat][svc]).length === 0) {
        delete o[cat][svc];
      }
    }
  }

  return o;
};

export {
  schemaCategories,
  namesForSchemaCategories,
  serviceNames,
  isDescriptor,
  getServiceDisplayName,
  getSchemas,
  getConfig,
  putConfig,
  getConfigValue,
  setConfigValue,
  setAuthToken,
  schemaByCategories
};
