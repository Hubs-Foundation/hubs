import { waitForDOMContentLoaded } from "../utils/async-utils";

export class CursorTargettingSystem {
  constructor() {
    this.targets = [];
    this.setDirty = this.setDirty.bind(this);
    this.dirty = true;

    // TODO: Use the MutationRecords passed into the callback function to determine added/removed nodes!
    this.observer = new MutationObserver(this.setDirty);

    waitForDOMContentLoaded().then(() => {
      const scene = document.querySelector("a-scene");
      this.rightRemote = document.querySelector("#cursor-controller");
      this.observer.observe(scene, { childList: true, attributes: true, subtree: true });
      scene.addEventListener("object3dset", this.setDirty);
      scene.addEventListener("object3dremove", this.setDirty);
    });
  }

  setDirty() {
    this.dirty = true;
  }

  tick(t) {
    if (this.dirty) {
      this.populateEntities(this.targets);
      this.dirty = false;
    }

    this.rightRemote.components["cursor-controller"].tick2(t);
  }

  populateEntities(targets) {
    targets.length = 0;
    // TODO: Do not querySelectorAll on the entire scene every time anything changes!
    const els = AFRAME.scenes[0].querySelectorAll(".collidable, .interactable, .ui");
    for (let i = 0; i < els.length; i++) {
      if (els[i].object3D) {
        targets.push(els[i].object3D);
      }
    }
  }

  remove() {
    this.observer.disconnect();
    AFRAME.scenes[0].removeEventListener("object3dset", this.setDirty);
    AFRAME.scenes[0].removeEventListener("object3dremove", this.setDirty);
  }
}
