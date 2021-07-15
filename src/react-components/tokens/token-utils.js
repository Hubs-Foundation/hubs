import { fetchReticulumAuthenticated, getReticulumFetchUrl } from "../../utils/phoenix-utils.js";

const ENDPOINT = "/api/v2_alpha/credentials";
const CREDENTIALS_ENDPOINT_URL = getReticulumFetchUrl(ENDPOINT);

export async function fetchMyTokens() {
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

export async function createToken({ tokenType, scopes }) {
  console.log(scopes);
  console.log("tokenType " + tokenType);
  const res = await fetch(CREDENTIALS_ENDPOINT_URL, {
    headers: getHeaders(),
    method: "POST",
    body: JSON.stringify({
      scopes,
      subject_type: tokenType
    })
  });
  if (res.ok) {
    return res.json();
  } else {
    console.log(res.status);
    console.log(res.statusText);
    throw new Error(
      res.statusText ? res.statusText : "Something went wrong with creating a new token. Please try again."
    );
  }
  // TODO handle error case
}

export async function revokeToken({ id }) {
  console.log("trying revoke...");
  const res = await fetch(`${CREDENTIALS_ENDPOINT_URL}/${id}?revoke`, {
    headers: getHeaders(),
    method: "PUT",
    body: JSON.stringify({
      id,
      revoke: true
    })
  });
  if (res.ok) {
    return res.json();
  } else {
    console.log(res.status);
    console.log(res.statusText);
    throw new Error(res.statusText);
  }
}

export function fetchAvailableScopes() {
  // TODO turn into a fetch
  // fetch(`${CREDENTIALS_ENDPOINT}/scopes`, {
  //   headers: getHeaders()
  // })
  return ["read_rooms", "write_rooms"];
}
