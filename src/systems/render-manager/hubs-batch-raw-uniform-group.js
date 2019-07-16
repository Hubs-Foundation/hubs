import { BatchRawUniformGroup } from "@mozillareality/three-batch-manager";

const tempVec3 = new Array(3);
const tempVec4 = new Array(4);

export const INSTANCE_DATA_BYTE_LENGTH = 112;
const DEFAULT_COLOR = new THREE.Color(1, 1, 1);
const HIDE_MATRIX = new THREE.Matrix4().makeScale(0, 0, 0);

export function sizeofInstances(instanceCount) {
  const hubsDataSize =
    instanceCount * 4 * 4 + // sweepParams
    4 *
      (3 + // interactorOnePos
      1 + // isFrozen
      3 + // interactorTwoPos
        1); // time
  return instanceCount * INSTANCE_DATA_BYTE_LENGTH + hubsDataSize;
}

export default class HubsBatchRawUniformGroup extends BatchRawUniformGroup {
  constructor(maxInstances, meshToEl) {
    const data = new ArrayBuffer(sizeofInstances(maxInstances));
    super(maxInstances, "InstanceData", data);

    let offset = this.offset;
    this.hubs_sweepParams = new Float32Array(this.data, offset, 4 * maxInstances);
    offset += this.hubs_sweepParams.byteLength;

    this.hubs_interactorOnePos = new Float32Array(this.data, offset, 3);
    offset += this.hubs_interactorOnePos.byteLength;

    this.hubs_isFrozen = new Uint32Array(this.data, offset, 1);
    offset += this.hubs_isFrozen.byteLength;

    this.hubs_interactorTwoPos = new Float32Array(this.data, offset, 3);
    offset += this.hubs_interactorTwoPos.byteLength;

    this.hubs_time = new Float32Array(this.data, offset, 1);
    offset += this.hubs_time.byteLength;

    this.offset = offset;

    this.meshToEl = meshToEl;
  }

  update(time) {
    const interaction = AFRAME.scenes[0].systems.interaction;
    let interactorOne, interactorTwo;

    for (let instanceId = 0; instanceId < this.meshes.length; instanceId++) {
      const mesh = this.meshes[instanceId];
      if (!mesh) continue;

      mesh.updateMatrices();

      // TODO need to account for nested visibility deeper than 1 level
      this.setInstanceTransform(instanceId, mesh.visible && mesh.parent.visible ? mesh.matrixWorld : HIDE_MATRIX);
      this.setInstanceColor(instanceId, mesh.material.color || DEFAULT_COLOR, mesh.material.opacity || 1);

      const el = this.meshToEl.get(mesh);
      if (el) {
        const obj = el.object3D;
        const hoverableVisuals = el.components["hoverable-visuals"];
        const worldY = obj.matrixWorld.elements[13];
        const scaledRadius = obj.scale.y * hoverableVisuals.boundingSphere.radius;

        const isPinned = el.components.pinnable && el.components.pinnable.data.pinned;
        const isSpawner = !!el.components["super-spawner"];
        const isFrozen = el.sceneEl.is("frozen");
        const hideDueToPinning = !isSpawner && isPinned && !isFrozen;

        let highlightInteractorOne, highlightInteractorTwo;
        if (interaction.state.leftHand.hovered === el || interaction.state.leftHand.held === el) {
          interactorOne = interaction.options.leftHand.entity.object3D;
          highlightInteractorOne = true;
        }

        if (interaction.state.rightRemote.hovered === el || interaction.state.rightRemote.held === el) {
          interactorTwo = interaction.options.rightRemote.entity.object3D;
          highlightInteractorTwo = true;
        } else if (interaction.state.rightHand.hovered === el || interaction.state.rightHand.held === el) {
          interactorTwo = interaction.options.rightHand.entity.object3D;
          highlightInteractorTwo = true;
        }

        tempVec4[0] = worldY - scaledRadius;
        tempVec4[1] = worldY + scaledRadius;
        tempVec4[2] = !!highlightInteractorOne && !hideDueToPinning;
        tempVec4[3] = !!highlightInteractorTwo && !hideDueToPinning;
        this.hubs_sweepParams.set(tempVec4, instanceId * 4);
      }
    }

    if (interactorOne) {
      tempVec3[0] = interactorOne.matrixWorld.elements[12];
      tempVec3[1] = interactorOne.matrixWorld.elements[13];
      tempVec3[2] = interactorOne.matrixWorld.elements[14];
      this.hubs_interactorOnePos.set(tempVec3);
    }

    if (interactorTwo) {
      tempVec3[0] = interactorTwo.matrixWorld.elements[12];
      tempVec3[1] = interactorTwo.matrixWorld.elements[13];
      tempVec3[2] = interactorTwo.matrixWorld.elements[14];
      this.hubs_interactorTwoPos.set(tempVec3);
    }

    this.hubs_time[0] = time;
    this.hubs_isFrozen[0] = AFRAME.scenes[0].is("frozen") ? 1 : 0;
  }
}
