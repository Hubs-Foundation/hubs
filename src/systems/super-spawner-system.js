import { addMedia } from "../utils/media-utils";
import { ObjectContentOrigins } from "../object-types";

// WARNING: This system mutates interaction system state!
export class SuperSpawnerSystem {
  maybeSpawn(state, entity, grabPath) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const superSpawner = state.hovered && state.hovered.components["super-spawner"];
    if (
      superSpawner &&
      !superSpawner.cooldownTimeout &&
      userinput.get(grabPath) &&
      window.APP.hubChannel.can("spawn_and_move_media")
    ) {
      this.performSpawn(state, entity, grabPath, userinput, superSpawner);
    }
  }

  performSpawn(state, entity, grabPath, userinput, superSpawner) {
    entity.object3D.updateMatrices();
    entity.object3D.matrix.decompose(entity.object3D.position, entity.object3D.quaternion, entity.object3D.scale);
    const data = superSpawner.data;

    const targetScale = new THREE.Vector3(data.spawnScale.x, data.spawnScale.y, data.spawnScale.z);
    if (!data.useCustomSpawnScale) {
      superSpawner.el.object3D.getWorldScale(targetScale);
    }

    const spawnedEntity = addMedia(
      data.src,
      data.template,
      ObjectContentOrigins.SPAWNER,
      null,
      data.resolve,
      data.fitToBox,
      false,
      targetScale
    ).entity;

    if (data.useCustomSpawnPosition) {
      spawnedEntity.object3D.position.copy(data.spawnPosition);
    } else {
      superSpawner.el.object3D.getWorldPosition(spawnedEntity.object3D.position);
    }
    if (data.useCustomSpawnRotation) {
      spawnedEntity.object3D.rotation.copy(data.spawnRotation);
    } else {
      superSpawner.el.object3D.getWorldQuaternion(spawnedEntity.object3D.quaternion);
    }
    spawnedEntity.object3D.matrixNeedsUpdate = true;
    state.held = spawnedEntity;

    superSpawner.activateCooldown();
    state.spawning = true;

    spawnedEntity.addEventListener(
      "media-loaded",
      () => {
        state.spawning = false;
      },
      { once: true }
    );
  }

  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    if (!interaction.ready) return; //DOMContentReady workaround
    this.maybeSpawn(
      interaction.state.leftHand,
      interaction.options.leftHand.entity,
      interaction.options.leftHand.grabPath
    );
    this.maybeSpawn(
      interaction.state.rightHand,
      interaction.options.rightHand.entity,
      interaction.options.rightHand.grabPath
    );
    this.maybeSpawn(
      interaction.state.rightRemote,
      interaction.options.rightRemote.entity,
      interaction.options.rightRemote.grabPath
    );
    this.maybeSpawn(
      interaction.state.leftRemote,
      interaction.options.leftRemote.entity,
      interaction.options.leftRemote.grabPath
    );
  }
}
