import Store from "./storage/store";
import MediaSearchStore from "./storage/media-search-store";

export class App {
  constructor() {
    this.scene = null;
    this.store = new Store();
    this.mediaSearchStore = new MediaSearchStore();
  }
}
