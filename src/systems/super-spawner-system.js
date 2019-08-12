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
    const spawnedEntity = addMedia(
      data.src,
      data.template,
      ObjectContentOrigins.SPAWNER,
      null,
      data.resolve,
      data.resize,
      false
    ).entity;

    spawnedEntity.object3D.position.copy(
      data.useCustomSpawnPosition ? data.spawnPosition : superSpawner.el.object3D.position
    );
    spawnedEntity.object3D.rotation.copy(
      data.useCustomSpawnRotation ? data.spawnRotation : superSpawner.el.object3D.rotation
    );
    spawnedEntity.object3D.matrixNeedsUpdate = true;
    state.held = spawnedEntity;

    const targetScale = superSpawner.el.object3D.scale.clone();

    superSpawner.activateCooldown();
    state.spawning = true;

    spawnedEntity.addEventListener(
      "model-loaded",
      () => {
        if (spawnedEntity.object3DMap.mesh) {
          spawnedEntity.object3DMap.mesh.scale.copy(data.useCustomSpawnScale ? data.spawnScale : targetScale);
          spawnedEntity.object3DMap.mesh.matrixNeedsUpdate = true;
        }

        state.spawning = false;
      },
      { once: true }
    );
  }

  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
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
