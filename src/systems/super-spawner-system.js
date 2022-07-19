import { addMedia } from "../utils/media-utils";
import { ObjectContentOrigins } from "../object-types";
import { Held, HeldHandLeft, HeldHandRight, HeldRemoteLeft, HeldRemoteRight } from "../bit-components";
import { addComponent } from "bitecs";

// WARNING: This system mutates interaction system state!
export class SuperSpawnerSystem {
  maybeSpawn(state, grabPath, HeldComponent) {
    const userinput = AFRAME.scenes[0].systems.userinput;
    const superSpawner = state.hovered && state.hovered.components["super-spawner"];

    const isPermitted =
      window.APP.hubChannel &&
      (superSpawner && superSpawner.data.template === "#interactable-emoji"
        ? window.APP.hubChannel.can("spawn_emoji")
        : window.APP.hubChannel.can("spawn_and_move_media"));

    if (
      superSpawner &&
      superSpawner.spawnedMediaScale &&
      !superSpawner.cooldownTimeout &&
      userinput.get(grabPath) &&
      isPermitted
    ) {
      this.performSpawn(state, superSpawner, HeldComponent);
    }
  }

  performSpawn(state, superSpawner, HeldComponent) {
    const data = superSpawner.data;

    const spawnedEntity = addMedia(
      data.src,
      data.template,
      ObjectContentOrigins.SPAWNER,
      null,
      data.resolve,
      true,
      false,
      data.mediaOptions
    ).entity;

    // TODO HACK objects become held mid frame here, so if something runs between here and
    // when the networked component is initialized isMine will throw since data doesnt exist
    // should probably fix isMine in networked aframe instead of merging this
    if (spawnedEntity.components.networked && !spawnedEntity.components.networked.data) {
      spawnedEntity.components.networked.data = {};
    }

    superSpawner.el.object3D.getWorldPosition(spawnedEntity.object3D.position);
    superSpawner.el.object3D.getWorldQuaternion(spawnedEntity.object3D.quaternion);
    spawnedEntity.object3D.matrixNeedsUpdate = true;

    superSpawner.el.emit("spawned-entity-created", { target: spawnedEntity });

    superSpawner.activateCooldown();

    spawnedEntity.addEventListener(
      "media-loaded",
      () => {
        spawnedEntity.object3D.scale.copy(superSpawner.spawnedMediaScale);
        spawnedEntity.object3D.matrixNeedsUpdate = true;

        superSpawner.el.emit("spawned-entity-loaded", { target: spawnedEntity });

        // TODO we do this in media loaded as the entity doesn't appear to actually be initialized right away (and thus doesn't have an eid)
        // This is fairly hacky and is why we had equally hacky "spawning" state stuff before. This goes away with non aframe entities so
        // just localizing and carrying forward the hack for now.
        addComponent(APP.world, HeldComponent, spawnedEntity.eid);
        addComponent(APP.world, Held, spawnedEntity.eid);
      },
      { once: true }
    );
  }

  tick() {
    const interaction = AFRAME.scenes[0].systems.interaction;
    if (!interaction.ready) return; //DOMContentReady workaround
    this.maybeSpawn(interaction.state.leftHand, interaction.options.leftHand.grabPath, HeldHandLeft);
    this.maybeSpawn(interaction.state.rightHand, interaction.options.rightHand.grabPath, HeldHandRight);
    this.maybeSpawn(interaction.state.rightRemote, interaction.options.rightRemote.grabPath, HeldRemoteRight);
    this.maybeSpawn(interaction.state.leftRemote, interaction.options.leftRemote.grabPath, HeldRemoteLeft);
  }
}
