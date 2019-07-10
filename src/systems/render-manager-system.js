import { BatchManager } from "@mozillareality/three-batch-manager";

export class RenderManagerSystem {
  constructor(scene, renderer) {
    this.batchManager = new BatchManager(scene, renderer);
  }

  addObject(rootObject) {
    rootObject.updateMatrixWorld(true);
    let batchedCount = 0;
    rootObject.traverse(object => {
      if (object.isMesh && !object.isSkinnedMesh && !object.material.transparent && object.name !== "NavMesh") {
        if (this.batchManager.addMesh(object)) {
          object.batched = true;
          batchedCount++;
        }
      }
    });
    return batchedCount;
  }

  removeObject(rootObject) {
    rootObject.traverse(object => {
      if (object.isMesh && !object.isSkinnedMesh && !object.material.transparent && object.name !== "NavMesh") {
        this.batchManager.removeMesh(object);
        object.batched = false;
      }
    });
  }

  tick(dt) {
    this.batchManager.update(dt);
  }

  remove() {}
}
