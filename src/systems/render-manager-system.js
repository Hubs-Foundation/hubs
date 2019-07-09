import { BatchManager } from "three-render-manager";

import HubsBatchRawUniformGroup from "./render-manager/hubs-batch-raw-uniform-group";
import unlitBatchVert from "./render-manager/unlit-batch.vert";
import unlitBatchFrag from "./render-manager/unlit-batch.frag";

export class RenderManagerSystem {
  constructor(scene, renderer) {
    const maxInstances = 256;
    this.meshToEl = new WeakMap();
    this.ubo = new HubsBatchRawUniformGroup(maxInstances, this.meshToEl);
    this.batchManager = new BatchManager(scene, renderer, {
      maxInstances: maxInstances,
      ubo: this.ubo,
      shaders: {
        unlit: {
          vertexShader: unlitBatchVert,
          fragmentShader: unlitBatchFrag
        }
      }
    });
  }

  addObject(rootObject) {
    rootObject.updateMatrixWorld(true);
    let batchedCount = 0;
    rootObject.traverse(object => {
      if (object.isMesh && !object.isSkinnedMesh && !object.material.transparent && object.name !== "NavMesh") {
        if (this.batchManager.addMesh(object)) batchedCount++;
      }
    });
    return batchedCount;
  }

  removeObject(rootObject) {
    rootObject.traverse(object => {
      if (object.isMesh && !object.isSkinnedMesh && !object.material.transparent && object.name !== "NavMesh") {
        this.batchManager.removeMesh(object);
      }
    });
  }

  tick(time) {
    this.batchManager.update(time);
  }
}
