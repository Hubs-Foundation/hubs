import { fetchReticulumAuthenticated, getReticulumFetchUrl } from "../../utils/phoenix-utils.js";

const ENDPOINT = "/api/v2_alpha/credentials";
const SCOPES_ENDPOINT = getReticulumFetchUrl("/api/v1/credentials/scopes");
const CREDENTIALS_ENDPOINT_URL = getReticulumFetchUrl(ENDPOINT);

export async function fetchMyTokens() {
  return fetchReticulumAuthenticated(ENDPOINT).then(function (tokens) {
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
    throw new Error(
      res.statusText ? res.statusText : "Something went wrong with creating a new token. Please try again."
    );
  }
}

export async function revokeToken({ id }) {
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
    throw new Error(res.statusText);
  }
}

export async function fetchAvailableScopes() {
  const res = await fetch(SCOPES_ENDPOINT, {
    headers: getHeaders(),
    method: "GET"
  });
  if (res.ok) {
    return res.json();
  } else {
    throw new Error(res.statusText);
  }
}
