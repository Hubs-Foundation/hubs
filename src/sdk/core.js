import { generateHubName } from "../utils/name-generation";
import { getReticulumFetchUrl, isLocalClient } from "../utils/phoenix-utils";
import configs from "../utils/configs";

class SDK {
  constructor(store) {
    this.store = store;
    this.config = {
      feature: configs.feature,
      image: configs.image,
      link: configs.link
    };
  }

  registerPlugin(hook, exports) {
    configs.registerPlugin(hook, exports);
  }

  isAuthenticated() {
    return !!this.getAuthToken();
  }

  getAuthToken() {
    return this.store.state && this.store.state.credentials.token;
  }

  async postJSON(path, payload, { headers, ...options } = {}) {
    const createUrl = getReticulumFetchUrl(path);

    const response = await fetch(createUrl, {
      body: JSON.stringify(payload),
      headers: {
        "content-type": "application/json",
        ...headers
      },
      method: "POST",
      ...options
    });

    const json = await response.json();

    return json;
  }

  async postJSONAuthenticated(path, payload, { headers, ...options } = {}) {
    if (!this.isAuthenticated()) {
      throw new Error("Not Authenticated");
    }

    return this.postJSON(path, payload, {
      headers: {
        authorization: `bearer ${this.getAuthToken()}`,
        ...headers
      },
      ...options
    });
  }

  async createRoom(params = {}) {
    const payload = {
      hub: {
        ...params,
        name: params.name || generateHubName()
      }
    };

    let response;

    if (this.isAuthenticated()) {
      response = await this.postJSONAuthenticated("/api/v1/hubs", payload);

      if (response.error === "invalid_token") {
        // Clear the invalid token from store.
        this.store.update({ credentials: { token: null, email: null } });
        response = undefined;
      }
    }

    if (!response) {
      // Create hub anonymously
      response = await this.postJSON("/api/v1/hubs", payload);
    }

    const creatorAssignmentToken = response.creator_assignment_token;

    if (creatorAssignmentToken) {
      this.store.update({
        creatorAssignmentTokens: [{ hubId: response.hub_id, creatorAssignmentToken: creatorAssignmentToken }]
      });

      // Don't need to store the embed token if there's no creator assignment token, since that means
      // we are the owner and will get the embed token on page load.
      const embedToken = response.embed_token;

      if (embedToken) {
        this.store.update({ embedTokens: [{ hubId: response.hub_id, embedToken: embedToken }] });
      }
    }

    if (isLocalClient()) {
      response.url = new URL(`/hub.html?hub_id=${response.hub_id}`, window.location).href;
    }

    return response;
  }
}

export default function init(store) {
  window.Hubs.core = new SDK(store);
}
