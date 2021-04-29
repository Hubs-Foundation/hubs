import { fetchReticulumAuthenticated, getReticulumFetchUrl } from "../../utils/phoenix-utils.js";

const ENDPOINT = "/api/v2_alpha/credentials";
const CREDENTIALS_ENDPOINT_URL = getReticulumFetchUrl(ENDPOINT);

export function fetchMyTokens() {
  return fetchReticulumAuthenticated(ENDPOINT).then(function(tokens) {
    console.log(tokens);
    return tokens.credentials;
  });
}

function getHeaders() {
  return {
    "content-type": "application/json",
    authorization: `bearer ${window.APP.store.state.credentials.token}`
  };
}

export function createToken({ scopes, cb }) {
  console.log(scopes);
  fetch(CREDENTIALS_ENDPOINT_URL, {
    headers: getHeaders(),
    method: "POST",
    body: JSON.stringify({
      scopes,
      subject_type: "account"
    })
  }).then(async r => {
    const result = await r.text();
    return cb(JSON.parse(result));
  });
  // TODO handle error case
}

export function revokeToken({ id }) {
  console.log("trying revoke...");
  fetch(`${CREDENTIALS_ENDPOINT_URL}/${id}?revoke`, {
    headers: getHeaders(),
    method: "PUT",
    body: JSON.stringify({
      id,
      revoke: true
    })
  }).then(async r => {
    const result = await r.text();
    return JSON.parse(result);
  });
}

export function fetchAvailableScopes() {
  // TODO turn into a fetch
  // fetch(`${CREDENTIALS_ENDPOINT}/scopes`, {
  //   headers: getHeaders()
  // }).then(async r => {
  //   const result = await r.text();
  //   return JSON.parse(result);
  // }).catch(e => {
  // todo fix
  //   throw new Error("failed to fetch scopes")
  // });;
  return ["read_rooms", "write_rooms"];
}
