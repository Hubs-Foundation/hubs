import { EventTarget } from "event-target-shim";
import { getReticulumFetchUrl } from "../utils/phoenix-utils";

export default class MediaSearchStore extends EventTarget {
  constructor() {
    super();
    this.requestIndex = 0;
  }

  async update(params) {
    const searchParams = new URLSearchParams();

    for (const [k, v] of Object.entries(params)) {
      searchParams.set(k, v);
    }

    this.requestIndex++;
    const currentRequestIndex = this.requestIndex;
    const url = getReticulumFetchUrl(`/api/v1/media/search?${searchParams.toString()}`);
    const res = await fetch(url);
    if (this.requestIndex != currentRequestIndex) return;

    this.result = await res.json();
    this.dispatchEvent(new CustomEvent("statechanged"));
  }
}
