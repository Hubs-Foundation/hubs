import { EventTarget } from "event-target-shim";
import { getReticulumFetchUrl } from "../utils/phoenix-utils";
import createHistory from "history/createBrowserHistory";

const history = createHistory();

export default class MediaSearchStore extends EventTarget {
  constructor() {
    super();

    this.requestIndex = 0;
    this.update();

    history.listen(() => {
      this.update();
    });
  }

  update = async () => {
    if (!history.location.state || !history.location.state.media_query) return;

    const searchParams = new URLSearchParams();
    console.log(history.location.state);

    for (const [k, v] of Object.entries(history.location.state.media_query)) {
      searchParams.set(k, v);
    }

    this.requestIndex++;
    const currentRequestIndex = this.requestIndex;
    const url = getReticulumFetchUrl(`/api/v1/media/search?${searchParams.toString()}`);
    if (this.lastSavedUrl === url) return;

    const res = await fetch(url);
    if (this.requestIndex != currentRequestIndex) return;

    this.result = await res.json();
    this.lastFetchedUrl = url;
    this.dispatchEvent(new CustomEvent("statechanged"));
  };
}
