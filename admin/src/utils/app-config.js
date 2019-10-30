let currentAuthToken = null;

function setAuthToken(token) {
  currentAuthToken = token;
}

function fetchAppConfigs(method, body) {
  return fetch("/api/v1/app_configs", {
    method,
    headers: { Authorization: `Bearer ${currentAuthToken}` },
    body
  });
}

function getConfig() {
  return fetchAppConfigs("GET").then(r => r.json());
}

function putConfig(config) {
  return fetchAppConfigs("POST", JSON.stringify(config));
}

export { getConfig, putConfig, setAuthToken };
