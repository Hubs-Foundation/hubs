import store from "./storage/store";
import MediaSearchStore from "./storage/media-search-store";

export class App {
  constructor() {
    this.scene = null;
    this.quality = "low";
    this.store = store;
    this.mediaSearchStore = new MediaSearchStore();
  }

  setQuality(quality) {
    if (this.quality === quality) {
      return false;
    }

    this.quality = quality;

    if (this.scene) {
      this.scene.dispatchEvent(new CustomEvent("quality-changed", { detail: quality }));
    }

    return true;
  }
}
