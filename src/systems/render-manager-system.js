import { BatchManager } from "three-render-manager";

export class RenderManagerSystem {
  constructor(scene, renderer) {
    this.batchManager = new BatchManager(scene, renderer);
  }

  addObject(rootObject) {
    rootObject.updateMatrixWorld(true);
    rootObject.traverse(object => {
      if (object.isMesh && !object.material.transparent) {
        this.batchManager.addMesh(object);
        object.batched = true;
      }
    });
  }

  tick(dt) {
    this.batchManager.update(dt);
  }

  remove() {}
}
