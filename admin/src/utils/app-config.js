import { upload } from "hubs/src/utils/media-utils";

let currentAuthToken = null;

function setAuthToken(token) {
  currentAuthToken = token;
}

function fetchAppConfigs(method, body) {
  return fetch("/api/v1/app_configs", {
    method,
    headers: {
      Authorization: `Bearer ${currentAuthToken}`,
      "Content-Type": "application/json"
    },
    body
  });
}

function getConfig() {
  return fetchAppConfigs("GET").then(r => r.json());
}

async function putConfig(config) {
  const uploadFiles = async obj => {
    for (const key in obj) {
      if (!obj.hasOwnProperty(key)) continue;
      const val = obj[key];
      if (val instanceof File) {
        obj[key] = await upload(val);
      } else if (val instanceof Object) {
        await uploadFiles(val);
      }
    }
  };
  await uploadFiles(config);
  return fetchAppConfigs("POST", JSON.stringify(config));
}

export { getConfig, putConfig, setAuthToken };
