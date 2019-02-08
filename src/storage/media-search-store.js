import { EventTarget } from "event-target-shim";
import { getReticulumFetchUrl } from "../utils/phoenix-utils";
import { pushHistoryPath } from "../utils/history";

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
    let source = pathname.substring(7);

    if (source === "scenes") {
      source = "scene_listings"; // /scenes more ergonomic but API uses scene_listings
    }

    this.requestIndex++;
    const currentRequestIndex = this.requestIndex;
    const searchParams = new URLSearchParams(location.search);
    const url = getReticulumFetchUrl(`/api/v1/media/search?${searchParams.toString()}&source=${source}`);
    if (this.lastSavedUrl === url) return;

    const res = await fetch(url);
    if (this.requestIndex != currentRequestIndex) return;

    this.result = await res.json();
    this.lastFetchedUrl = url;
    this.dispatchEvent(new CustomEvent("statechanged"));
  };

  pageNavigate = delta => {
    const location = this.history.location;
    const searchParams = new URLSearchParams(location.search);
    const currentPage = +(searchParams.get("page") || 1);
    searchParams.set("page", currentPage + delta);
    pushHistoryPath(this.history, location.pathname, searchParams.toString());
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

    searchParams.delete("page");

    pushHistoryPath(this.history, location.pathname, searchParams.toString());
  };

  sourceNavigate = source => {
    pushHistoryPath(this.history, `/media/${source}`);
  };
}
