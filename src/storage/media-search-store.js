import { EventTarget } from "event-target-shim";
import { getReticulumFetchUrl } from "../utils/phoenix-utils";
import { pushHistoryPath } from "../utils/history";

const URL_SOURCE_TO_TO_API_SOURCE = {
  scenes: "scene_listings",
  images: "bing_images",
  videos: "bing_videos",
  gifs: "tenor",
  sketchfab: "sketchfab",
  poly: "poly",
  twitch: "twitch"
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
    const pathname = location.pathname;
    if (!pathname.startsWith("/media")) return;
    const urlSource = pathname.substring(7);

    this.requestIndex++;
    const currentRequestIndex = this.requestIndex;
    const urlParams = new URLSearchParams(location.search);
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
    if (delta == -1) {
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

    pushHistoryPath(this.history, location.pathname, searchParams.toString());
  };

  sourceNavigate = source => {
    pushHistoryPath(this.history, `/media/${source}`);
  };
}
