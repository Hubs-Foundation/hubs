import { EventTarget } from "event-target-shim";
import { getReticulumFetchUrl } from "../utils/phoenix-utils";
import { pushHistoryPath, sluglessPath, withSlug } from "../utils/history";
import { avatars } from "../assets/avatars/avatars";
import qsTruthy from "../utils/qs_truthy";

export const SOURCES = ["videos", "sketchfab", "poly", "scenes", "gifs", "images", "twitch"];

const URL_SOURCE_TO_TO_API_SOURCE = {
  scenes: "scene_listings",
  images: "bing_images",
  videos: "bing_videos",
  youtube: "youtube_videos",
  gifs: "tenor",
  sketchfab: "sketchfab",
  poly: "poly",
  twitch: "twitch"
};

export const MEDIA_SOURCE_DEFAULT_FILTERS = {
  gifs: "trending",
  sketchfab: "featured",
  scenes: "featured"
};

const SEARCH_CONTEXT_PARAMS = ["q", "filter", "cursor"];

// This class is responsible for fetching and storing media search results and provides a
// convenience API for performing history updates relevant to search navigation.
export default class MediaSearchStore extends EventTarget {
  constructor() {
    super();

    this.requestIndex = 0;
  }

  setHistory(history) {
    this.history = history;

    this._update(this.history.location);

    this.history.listen(location => {
      this._update(location);
    });
  }

  _update = async location => {
    this.result = null;
    this.dispatchEvent(new CustomEvent("statechanged"));

    const urlSource = this.getUrlMediaSource(location);
    if (!urlSource) return;

    if (!this.previousSource || this.previousSource !== urlSource) {
      this.dispatchEvent(new CustomEvent("sourcechanged"));
      this.previousSource = urlSource;
    }

    const urlParams = new URLSearchParams(location.search);

    this.requestIndex++;
    const currentRequestIndex = this.requestIndex;
    const searchParams = new URLSearchParams();

    for (const param of SEARCH_CONTEXT_PARAMS) {
      if (!urlParams.get(param)) continue;
      searchParams.set(param, urlParams.get(param));
    }

    searchParams.get("locale", navigator.languages[0]);

    let source;
    if (urlSource === "avatars" || urlSource === "scenes") {
      // Avatars + scenes are special since we request them from a different source based on the facet.
      const singular = urlSource === "avatars" ? "avatar" : "scene";
      const filter = new URLSearchParams(location.search);
      source = filter.get("filter").startsWith("my-") ? `${singular}s` : `${singular}_listings`;
    } else {
      source = URL_SOURCE_TO_TO_API_SOURCE[urlSource];
    }
    searchParams.set("source", source);

    if (source === "avatars" || source === "scenes") {
      searchParams.set("user", window.APP.store.credentialsAccountId);
    }

    const url = getReticulumFetchUrl(`/api/v1/media/search?${searchParams.toString()}`);
    if (this.lastSavedUrl === url) return;

    const result = await this._fetchMedia(url, source);

    if (this.requestIndex != currentRequestIndex) return;

    this.result = result;
    this.nextCursor = this.result.meta && this.result.meta.next_cursor;
    this.lastFetchedUrl = url;
    this.dispatchEvent(new CustomEvent("statechanged"));
  };

  _fetchMedia = async (url, source) => {
    if (source === "avatar_listings" && !qsTruthy("use_avatar_listings")) {
      // Use our legacy avatars until we are ready with real featured avatars.
      return { entries: avatars.map(this._legacyAvatarToSearchEntry) };
    }

    const headers = { "Content-Type": "application/json" };
    const credentialsToken = window.APP.store.state.credentials.token;
    if (credentialsToken) headers.authorization = `bearer ${credentialsToken}`;

    const res = await fetch(url, { method: "GET", headers });
    const body = await res.text();

    let result;
    try {
      result = JSON.parse(body);
    } catch (e) {
      result = body;
    }

    return result;
  };

  _legacyAvatarToSearchEntry = legacyAvatar => {
    return {
      id: legacyAvatar.id,
      type: "avatar_listing",
      url: legacyAvatar.url,
      images: { preview: { url: legacyAvatar.thumbnail, width: 720, height: 1280 } },
      gltfs: { avatar: legacyAvatar.model }
    };
  };

  pageNavigate = delta => {
    if (delta === -1) {
      this.history.goBack();
    } else {
      const location = this.history.location;
      const searchParams = new URLSearchParams(location.search);
      searchParams.set("cursor", this.nextCursor);
      pushHistoryPath(this.history, location.pathname, searchParams.toString());
    }
  };

  filterQueryNavigate = (filter, query) => {
    const location = this.history.location;
    const searchParams = new URLSearchParams(location.search);

    if (query) {
      searchParams.set("q", query);
    } else {
      searchParams.delete("q");
    }

    if (filter) {
      searchParams.set("filter", filter);
    } else {
      searchParams.delete("filter");
    }

    if (filter) {
      searchParams.set("cursor", filter);
    } else {
      searchParams.delete("cursor");
    }

    pushHistoryPath(this.history, location.pathname, searchParams.toString());
  };

  getSearchClearedSearchParams = (location, keepSource, keepNav) => {
    const searchParams = new URLSearchParams(location.search);

    // Strip browsing query params
    searchParams.delete("q");
    searchParams.delete("filter");
    searchParams.delete("cursor");

    if (!keepNav) {
      searchParams.delete("media_nav");
    }

    if (!keepSource) {
      searchParams.delete("media_source");
    }

    return searchParams;
  };

  _stashLastSearchParams = location => {
    const searchParams = new URLSearchParams(location.search);
    this._stashedParams = {};
    this._stashedSource = this.getUrlMediaSource(location);

    for (const param of SEARCH_CONTEXT_PARAMS) {
      const value = searchParams.get(param);

      if (value) {
        this._stashedParams[param] = value;
      }
    }
  };

  clearStashedQuery = () => {
    if (!this._stashedParams) return;
    delete this._stashedParams.q;
  };

  sourceNavigate = source => {
    this._sourceNavigate(source, false, true);
  };

  sourceNavigateToDefaultSource = () => {
    this._sourceNavigate(this._stashedSource ? this._stashedSource : SOURCES[0], false, true);
  };

  sourceNavigateWithNoNav = source => {
    this._sourceNavigate(source, true, false);
  };

  _sourceNavigate = async (source, hideNav, useLastStashedParams) => {
    const currentQuery = new URLSearchParams(this.history.location.search).get("q");
    const searchParams = this.getSearchClearedSearchParams(this.history.location);

    if (currentQuery) {
      searchParams.set("q", currentQuery);
    } else {
      if (useLastStashedParams && this._stashedParams) {
        for (const param of SEARCH_CONTEXT_PARAMS) {
          const value = this._stashedParams[param];

          // Only q param is compatible across sources, so keep it if is stashed.
          const useValue = param === "q" || this._stashedSource === source;

          if (value && useValue) {
            searchParams.set(param, value);
          }
        }
      } else {
        if (source === "avatars") {
          const hasAccountWithAvatars = await this._hasAccountWithAvatars();
          searchParams.set("filter", hasAccountWithAvatars ? "my-avatars" : "featured");
        } else if (MEDIA_SOURCE_DEFAULT_FILTERS[source]) {
          searchParams.set("filter", MEDIA_SOURCE_DEFAULT_FILTERS[source]);
        }
      }
    }

    this._stashedParams = null;
    this._stashedSource = null;

    if (hideNav) {
      searchParams.set("media_nav", "false");
    }

    if (process.env.RETICULUM_SERVER && document.location.host !== process.env.RETICULUM_SERVER) {
      searchParams.set("media_source", source);
      pushHistoryPath(this.history, this.history.location.pathname, searchParams.toString());
    } else {
      pushHistoryPath(this.history, withSlug(this.history.location, `/media/${source}`), searchParams.toString());
    }
  };

  _hasAccountWithAvatars = async () => {
    const { credentialsAccountId } = window.APP.store;
    if (!credentialsAccountId) return false;

    const searchParams = new URLSearchParams();
    const source = "avatars";
    searchParams.set("source", source);
    searchParams.set("user", credentialsAccountId);
    const url = getReticulumFetchUrl(`/api/v1/media/search?${searchParams.toString()}`);
    const result = await this._fetchMedia(url, source);
    return !!(result && result.entries) && result.entries.length > 0;
  };

  getUrlMediaSource = location => {
    const { search } = location;
    const urlParams = new URLSearchParams(search);
    const pathname = sluglessPath(location);

    if (!pathname.startsWith("/media") && !urlParams.get("media_source")) return null;
    return urlParams.get("media_source") || pathname.substring(7);
  };

  pushExitMediaBrowserHistory = (history, stashLastSearchParams = true) => {
    if (!history) history = this.history;

    if (stashLastSearchParams) this._stashLastSearchParams(history.location);

    const { pathname } = history.location;
    const hasMediaPath = sluglessPath(history.location).startsWith("/media");
    pushHistoryPath(
      history,
      hasMediaPath ? withSlug(history.location, "/") : pathname,
      this.getSearchClearedSearchParams(history.location).toString()
    );
    this.dispatchEvent(new CustomEvent("media-exit"));
  };
}
