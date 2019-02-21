import { EventTarget } from "event-target-shim";
import { getReticulumFetchUrl } from "../utils/phoenix-utils";
import { pushHistoryPath, sluglessPath, withSlug } from "../utils/history";

export const SOURCES = ["videos", "images", "gifs", "scenes", "sketchfab", "poly", "twitch"];

const URL_SOURCE_TO_TO_API_SOURCE = {
  scenes: "scene_listings",
  images: "bing_images",
  videos: "bing_videos",
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

    for (const param of ["q", "filter", "cursor"]) {
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

  getSearchClearedSearchParams = location => {
    const searchParams = new URLSearchParams(location.search);

    // Strip browsing query params
    searchParams.delete("q");
    searchParams.delete("filter");
    searchParams.delete("cursor");
    searchParams.delete("media_source");
    searchParams.delete("media_nav");

    return searchParams;
  };

  sourceNavigateToDefaultSource = () => {
    this.sourceNavigate(SOURCES[0]);
  };

  sourceNavigate = (source, hideNav) => {
    const currentQuery = new URLSearchParams(this.history.location.search).get("q");
    const searchParams = this.getSearchClearedSearchParams(this.history.location);

    if (currentQuery) {
      searchParams.set("q", currentQuery);
    } else if (MEDIA_SOURCE_DEFAULT_FILTERS[source]) {
      searchParams.set("filter", MEDIA_SOURCE_DEFAULT_FILTERS[source]);
    }

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

    const { pathname } = history.location;
    const hasMediaPath = pathname.startsWith("/media");
    pushHistoryPath(
      history,
      hasMediaPath ? "/" : pathname,
      this.getSearchClearedSearchParams(history.location).toString()
    );
  };
}
