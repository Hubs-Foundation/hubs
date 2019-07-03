import { BatchManager, BatchRawUniformGroup } from "three-render-manager";

const tempVec4 = new Array(0);

class HubsBatchRawUniformGroup extends BatchRawUniformGroup {
  constructor(maxInstances, name = "InstanceData") {
    super(maxInstances, name);
  }

  addMesh(mesh, atlas) {
    const instanceId = super.addMesh(mesh, atlas);
    console.log("adding mesh", mesh.el);
    return instanceId;
  }

  removeMesh(mesh, atlas) {
    super.removeMesh(mesh, atlas);

    const el = this.meshToEl.get(mesh);
    if (el) {
      this.meshToEl.remove(mesh);
      this.elToMesh.remove(el);
    }
  }

  update(instanceId, mesh) {
    mesh.updateMatrices();

    super.update(instanceId, mesh);

    // const uniforms = mesh.material && mesh.material.uniforms;

    // if (uniforms) {
    // const {
    //   hubs_IsFrozen,
    //   hubs_HighlightInteractorOne,
    //   hubs_HighlightInteractorTwo,
    //   hubs_InteractorOnePos,
    //   hubs_SweepParams,
    //   hubs_InteractorTwoPos,
    //   hubs_Time
    // } = uniforms;
    // tempVec4[0] = uniforms.hubs_SweepParams.value[0];
    // tempVec4[1] = uniforms.hubs_SweepParams.value[1];
    // tempVec4[2] = uniforms.hubs_HighlightInteractorOne.value ? 1 : 0;
    // tempVec4[3] = uniforms.hubs_HighlightInteractorTwo.value ? 1 : 0;
    //
    //
    const worldY = mesh.matrixWorld.elements[13];
    if (!mesh.geometry.boundingSphere) mesh.geometry.computeBoundingSphere();
    const scaledRadius = mesh.scale.y * mesh.geometry.boundingSphere.radius;
    tempVec4[0] = worldY - scaledRadius;
    tempVec4[1] = worldY + scaledRadius;
    tempVec4[2] = 0;
    tempVec4[3] = 0;
    this.hubs_sweepParams.set(tempVec4, instanceId * 4);
    // }
  }
}

export class RenderManagerSystem {
  constructor(scene, renderer) {
    const maxInstances = 256;
    this.ubo = new HubsBatchRawUniformGroup(maxInstances);
    this.batchManager = new BatchManager(scene, renderer, {
      maxInstances: maxInstances,
      ubo: this.ubo
    });
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

  tick(time) {
    this.ubo.hubs_time[0] = time;
    this.ubo.hubs_isFrozen[0] = AFRAME.scenes[0].is("frozen") ? 1 : 0;
    this.batchManager.update(time);
  }

  remove() {}
}
