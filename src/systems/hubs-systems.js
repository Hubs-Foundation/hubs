class CursorTargettingSystem {
  constructor() {
    this.targets = [];
    this.setDirty = this.setDirty.bind(this);
    this.dirty = true;
    // TODO: Use the MutationRecords passed into the callback function to determine added/removed nodes!
    this.observer = new MutationObserver(this.setDirty);
    const scene = document.querySelector("a-scene");
    this.observer.observe(scene, { childList: true, attributes: true, subtree: true });
    scene.addEventListener("object3dset", this.setDirty);
    scene.addEventListener("object3dremove", this.setDirty);
  }

  setDirty() {
    this.dirty = true;
  }

  tick() {
    if (this.dirty) {
      this.populateEntities(this.targets);
      this.dirty = false;
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
    AFRAME.scenes[0].removeEventListener("object3dset", this.setDirty);
    AFRAME.scenes[0].removeEventListener("object3dremove", this.setDirty);
  }
}

AFRAME.registerSystem("hubs-systems", {
  init() {
    this.cursorTargettingSystem = new CursorTargettingSystem();
  },
  tick(t, dt) {
    const systems = AFRAME.scenes[0].systems;
    systems.userinput.tick2(t, dt);
    this.cursorTargettingSystem.tick();
    systems.interaction.tick2(t, dt);
  }
});
