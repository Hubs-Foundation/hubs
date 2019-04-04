import { waitForDOMContentLoaded } from "../utils/async-utils";

export class CursorTargettingSystem {
  constructor() {
    this.targets = [];
    this.dirty = true;
    this.onMutation = this.onMutation.bind(this);
    this.onObject3DSet = this.onObject3DSet.bind(this);
    this.onObject3DRemove = this.onObject3DRemove.bind(this);
    // TODO: Use the MutationRecords passed into the callback function to determine added/removed nodes!
    this.observer = new MutationObserver(this.onMutation);
    waitForDOMContentLoaded().then(() => {
      const scene = document.querySelector("a-scene");
      this.rightRemote = document.querySelector("#cursor-controller");
      this.observer.observe(scene, { childList: true, attributes: true, subtree: true });
      scene.addEventListener("object3dset", this.onObject3DSet);
      scene.addEventListener("object3dremove", this.onObject3DRemove);
    });
  }

  tick(t) {
    if (this.dirty) {
      this.populateEntities(this.targets);
      this.dirty = false;
    }

    this.rightRemote.components["cursor-controller"].tick2(t);
  }

  onObject3DSet() {
    this.dirty = true;
  }

  onObject3DRemove() {
    this.dirty = true;
  }

  onMutation(records) {
    // let's try to avoid re-querying the targets on attribute changes we know we can ignore
    if (records.some(r => r.type === "childList" || (r.type === "attributes" && r.attributeName === "class"))) {
      this.dirty = true;
    }
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
    AFRAME.scenes[0].removeEventListener("object3dset", this.onObject3DSet);
    AFRAME.scenes[0].removeEventListener("object3dremove", this.onObject3DRemove);
  }
}
