import { fetchReticulumAuthenticated, getReticulumFetchUrl } from "../../utils/phoenix-utils.js";

const endpoint = "/api/v2_alpha/credentials";

export function fetchMyTokens() {
  return fetchReticulumAuthenticated(endpoint).then(function(tokens) {
    console.log(tokens);
    return tokens.credentials;
  });
}

export function createToken({ scopes }) {
  console.log(scopes);
  fetch(getReticulumFetchUrl(endpoint), {
    headers: {
      "content-type": "application/json",
      authorization: `bearer ${window.APP.store.state.credentials.token}`
    },
    method: "POST",
    body: JSON.stringify({
      scopes,
      subject_type: "account"
    })
  }).then(async r => {
    const result = await r.text();
    return JSON.parse(result);
  });
}

export function revokeToken({ id }) {
    console.log("trying revoke...")
  fetch(`${getReticulumFetchUrl(endpoint)}?id=${id}&revoke`, {
    headers: {
      "content-type": "application/json",
      authorization: `bearer ${window.APP.store.state.credentials.token}`
    },
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
