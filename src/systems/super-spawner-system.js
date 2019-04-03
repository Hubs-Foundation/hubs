import { addMedia } from "../utils/media-utils";
import { ObjectContentOrigins } from "../object-types";
import { waitForEvent } from "../utils/async-utils";

// WARNING: This system mutates interaction system state!
export class SuperSpawnerSystem {
  async maybeSpawn(state, options) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const superSpawner = state.hovered && state.hovered.components["super-spawner"];
    if (superSpawner && !superSpawner.cooldownTimeout && userinput.get(options.grabPath)) {
      options.entity.object3D.updateMatrices();
      options.entity.object3D.matrix.decompose(
        options.entity.object3D.position,
        options.entity.object3D.quaternion,
        options.entity.object3D.scale
      );
      const data = superSpawner.data;
      const entity = addMedia(data.src, data.template, ObjectContentOrigins.SPAWNER, data.resolve, data.resize, false)
        .entity;
      entity.object3D.position.copy(
        data.useCustomSpawnPosition ? data.spawnPosition : superSpawner.el.object3D.position
      );
      entity.object3D.rotation.copy(
        data.useCustomSpawnRotation ? data.spawnRotation : superSpawner.el.object3D.rotation
      );
      entity.object3D.scale.copy(data.useCustomSpawnScale ? data.spawnScale : superSpawner.el.object3D.scale);
      entity.object3D.matrixNeedsUpdate = true;
      state.held = entity;

      superSpawner.activateCooldown();
      state.spawning = true;
      // WARNING: waitForEvent is semantically different than entity.addEventListener("body-loaded", ...)
      // and adding a callback fn via addEventListener will not work unless the callback function
      // wraps its code in setTimeout(()=>{...}, 0)
      await waitForEvent("body-loaded", entity);
      state.spawning = false;
      entity.object3D.position.copy(
        data.useCustomSpawnPosition ? data.spawnPosition : superSpawner.el.object3D.position
      );
      if (data.centerSpawnedObject) {
        entity.body.position.copy(options.entity.object3D.position);
      }
      entity.object3D.matrixNeedsUpdate = true;
    }
  }

  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    this.maybeSpawn(interaction.state.leftHand, interaction.options.leftHand);
    this.maybeSpawn(interaction.state.rightHand, interaction.options.rightHand);
    this.maybeSpawn(interaction.state.rightRemote, interaction.options.rightRemote);
  }
}
