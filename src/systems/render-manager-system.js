import { BatchManager } from "@mozillareality/three-batch-manager";

import HubsBatchRawUniformGroup from "./render-manager/hubs-batch-raw-uniform-group";
import { sizeofInstances } from "./render-manager/hubs-batch-raw-uniform-group";
import unlitBatchVert from "./render-manager/unlit-batch.vert";
import unlitBatchFrag from "./render-manager/unlit-batch.frag";

const MAX_INSTANCES = 500;
const UBO_BYTE_LENGTH = sizeofInstances(MAX_INSTANCES);

export class BatchManagerSystem {
  constructor(scene, renderer) {
    this.meshToEl = new WeakMap();

    this.batchingEnabled = window.WebGL2RenderingContext && renderer.context instanceof WebGL2RenderingContext;

    if (!this.batchingEnabled) {
      console.warn("Batching requires WebGL 2. Disabling batching.");
      return;
    }

    const gl = renderer.context;
    if (UBO_BYTE_LENGTH > gl.getParameter(gl.MAX_UNIFORM_BLOCK_SIZE)) {
      console.warn("Inusfficent MAX_UNIFORM_BLOCK_SIZE, Disabling batching");
      this.batchingEnabled = false;
      return;
    }

    this.ubo = new HubsBatchRawUniformGroup(MAX_INSTANCES, this.meshToEl);
    this.batchManager = new BatchManager(scene, renderer, {
      maxInstances: MAX_INSTANCES,
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
    if (!this.batchingEnabled) return 0;

    let batchedCount = 0;
    rootObject.traverse(object => {
      if (object.isMesh) {
        if (this.batchManager.addMesh(object)) batchedCount++;
      }
    });
    return batchedCount;
  }

  removeObject(rootObject) {
    if (!this.batchingEnabled) return;

    rootObject.traverse(object => {
      if (object.isMesh) {
        this.batchManager.removeMesh(object);
      }
    });
  }

  tick(time) {
    if (!this.batchingEnabled) return;

    this.batchManager.update(time);
  }
}
