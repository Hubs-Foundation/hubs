import { addMedia } from "../utils/media-utils";
import { ObjectContentOrigins } from "../object-types";

function setNonNullVec3Components(target, values) {
  target.set(
    values.x === null ? target.x : values.x,
    values.y === null ? target.y : values.y,
    values.z === null ? target.z : values.z
  );
}

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

    const targetScale = new THREE.Vector3();
    superSpawner.el.object3D.getWorldScale(targetScale);
    setNonNullVec3Components(targetScale, data.spawnScale);

    const spawnedEntity = addMedia(
      data.src,
      data.template,
      ObjectContentOrigins.SPAWNER,
      null,
      data.resolve,
      data.fitToBox,
      false,
      targetScale,
      data.mediaOptions
    ).entity;

    superSpawner.el.object3D.getWorldPosition(spawnedEntity.object3D.position);

    superSpawner.el.object3D.getWorldQuaternion(spawnedEntity.object3D.quaternion);

    spawnedEntity.object3D.matrixNeedsUpdate = true;

    superSpawner.el.emit("spawned-entity-created", { target: spawnedEntity });

    state.held = spawnedEntity;

    superSpawner.activateCooldown();
    state.spawning = true;

    spawnedEntity.addEventListener(
      "media-loaded",
      () => {
        state.spawning = false;
        superSpawner.el.emit("spawned-entity-loaded", { target: spawnedEntity });
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
