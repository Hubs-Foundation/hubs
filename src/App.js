import Store from "./storage/store";

export class App {
  constructor() {
    this.scene = null;
    this.quality = "low";
    this.store = new Store();
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
