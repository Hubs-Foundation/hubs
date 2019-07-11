import { addMedia } from "../utils/media-utils";
import { ObjectContentOrigins } from "../object-types";

// WARNING: This system mutates interaction system state!
export class SuperSpawnerSystem {
  maybeSpawn(state, entity, grabPath) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const superSpawner = state.hovered && state.hovered.components["super-spawner"];
    if (superSpawner && !superSpawner.cooldownTimeout && userinput.get(grabPath)) {
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
    spawnedEntity.object3D.scale.copy(data.useCustomSpawnScale ? data.spawnScale : superSpawner.el.object3D.scale);
    spawnedEntity.object3D.matrixNeedsUpdate = true;
    state.held = spawnedEntity;

    superSpawner.activateCooldown();
    state.spawning = true;
    // WARNING: previously used waitForEvent which is semantically different than
    // entity.addEventListener("body-loaded", ...) and adding a callback fn via
    // addEventListener will not work unless the callback function wraps its code in setTimeout(()=>{...}, 0)
    spawnedEntity.addEventListener(
      "body-loaded",
      () => {
        setTimeout(() => {
          state.spawning = false;
          spawnedEntity.object3D.position.copy(
            data.useCustomSpawnPosition ? data.spawnPosition : superSpawner.el.object3D.position
          );
          if (data.centerSpawnedObject) {
            spawnedEntity.body.position.copy(entity.object3D.position);
          }
          spawnedEntity.object3D.matrixNeedsUpdate = true;
        });
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
  }
}
