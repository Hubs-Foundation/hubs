import { EventTarget } from "event-target-shim";
import { getReticulumFetchUrl } from "../utils/phoenix-utils";
import { pushHistoryPath, sluglessPath, withSlug } from "../utils/history";

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

    this.update(this.history.location);

    this.history.listen(location => {
      this.update(location);
    });
  }

  update = async location => {
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
    searchParams.set("source", URL_SOURCE_TO_TO_API_SOURCE[urlSource]);

    const url = getReticulumFetchUrl(`/api/v1/media/search?${searchParams.toString()}`);
    if (this.lastSavedUrl === url) return;

    const res = await fetch(url);
    if (this.requestIndex != currentRequestIndex) return;

    this.result = await res.json();
    this.nextCursor = this.result.meta.next_cursor;
    this.lastFetchedUrl = url;
    this.dispatchEvent(new CustomEvent("statechanged"));
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

  getSearchClearedSearchParams = (location, keepSource) => {
    const searchParams = new URLSearchParams(location.search);

    // Strip browsing query params
    searchParams.delete("q");
    searchParams.delete("filter");
    searchParams.delete("cursor");
    searchParams.delete("media_nav");

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

  sourceNavigate = source => {
    this._sourceNavigate(source, false, true);
  };

  sourceNavigateToDefaultSource = () => {
    this._sourceNavigate(this._stashedSource ? this._stashedSource : SOURCES[0], false, true);
  };

  sourceNavigateWithNoNav = source => {
    this._sourceNavigate(source, true, false);
  };

  _sourceNavigate = (source, hideNav, useLastStashedParams) => {
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
        if (MEDIA_SOURCE_DEFAULT_FILTERS[source]) {
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

  getUrlMediaSource = location => {
    const { search } = location;
    const urlParams = new URLSearchParams(search);
    const pathname = sluglessPath(location);

    if (!pathname.startsWith("/media") && !urlParams.get("media_source")) return null;
    return urlParams.get("media_source") || pathname.substring(7);
  };

  pushExitMediaBrowserHistory = history => {
    if (!history) history = this.history;

    this._stashLastSearchParams(history.location);

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
