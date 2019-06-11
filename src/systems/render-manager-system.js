import { BatchManager } from "three-render-manager";

export class RenderManagerSystem {
  constructor(scene, renderer) {
    this.batchManager = new BatchManager(scene, renderer);
  }

  addObject(rootObject) {
    rootObject.updateMatrixWorld(true);
    rootObject.traverse(object => {
      if (object.isMesh && !object.isSkinnedMesh && !object.material.transparent && object.name !== "NavMesh") {
        console.log("Adding mesh to batch", object);
        this.batchManager.addMesh(object);
        object.batched = true;
      }
    });
  }

  removeObject(rootObject) {
    rootObject.traverse(object => {
      if (object.isMesh && !object.isSkinnedMesh && !object.material.transparent && object.name !== "NavMesh") {
        console.log("Removing mesh from batch", object);
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
