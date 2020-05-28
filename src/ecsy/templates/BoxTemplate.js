import { BoxBufferGeometry, MeshBasicMaterial, Vector3 } from "three";
import { SHAPE, FIT } from "three-ammo/constants";
import { NetworkTemplate, gatherPosition, gatherRotation, updatePosition, updateRotation } from "./NetworkTemplate";
import { Holdable } from "../components/Holdable";
import { Hoverable } from "../components/Hoverable";
import { ConstrainOnHeld } from "../components/ConstrainOnHeld";
import { PhysicsBody } from "../components/PhysicsBody";
import { PhysicsShape } from "../components/PhysicsShape";

export class BoxTemplate extends NetworkTemplate {
  static id = "box";

  createLocalEntity(world) {
    return world
      .createEntity()
      .addObject3DComponents(
        new THREE.Mesh(
          new BoxBufferGeometry(),
          new MeshBasicMaterial({ color: 0xff0000, opacity: 0.3, transparent: true })
        )
      )
      .addComponent(Hoverable)
      .addComponent(Holdable)
      .addComponent(PhysicsBody)
      .addComponent(PhysicsShape, { shape: SHAPE.BOX, fit: FIT.MANUAL, halfExtents: new Vector3(0.5, 0.5, 0.5) })
      .addComponent(ConstrainOnHeld);
  }

  createRemoteEntity(world) {
    return world
      .createEntity()
      .addObject3DComponents(
        new THREE.Mesh(
          new BoxBufferGeometry(),
          new MeshBasicMaterial({ color: 0xff0000, opacity: 0.3, transparent: true })
        )
      );
  }

  gatherEntityData(entity, lastSentData) {
    let nextData = gatherPosition(undefined, lastSentData, entity);
    nextData = gatherRotation(nextData, lastSentData, entity);
    return nextData;
  }

  updateEntity(entity, data) {
    updatePosition(entity, data);
    updateRotation(entity, data);
  }
}
