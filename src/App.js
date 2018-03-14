export class App {
  constructor() {
    this.scene = null;
    this.quality = "low";
  }

  setQuality(quality) {
    if (this.quality === quality) {
      return false;
    }

    this.quality = quality;

    if (this.scene) {
      console.log("quality-changed", quality);
      this.scene.dispatchEvent(new CustomEvent("quality-changed", { detail: quality }));
    }

    return true;
  }
}
