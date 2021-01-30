import { COLLISION_LAYERS } from "../constants";
import { SHAPE, TYPE } from "three-ammo/constants";

console.log(COLLISION_LAYERS, COLLISION_LAYERS.INTERACTABLES, COLLISION_LAYERS.DEFAULT_INTERACTABLE);

export class IframeSystem {
  constructor(scene) {
    this.scene = scene;

    this.scene.addEventListener("spawn-iframe", this.onSpawnIframe);
  }

  onSpawnIframe = () => {
    const entity = document.createElement("a-entity");
    entity.setAttribute("offset-relative-to", { target: "#avatar-pov-node", offset: { x: 0, y: 0, z: -1.5 } });
    entity.setAttribute("geometry", { primitive: "box", width: 1, height: 1, depth: 1 });
    entity.setAttribute("material", { color: "red" });
    entity.setAttribute("class", "interactable");
    entity.setAttribute("is-remote-hover-target", "");
    entity.setAttribute("hoverable-visuals", "");
    entity.setAttribute("tags", {
      isHandCollisionTarget: true,
      isHoldable: true,
      offersRemoteConstraint: true,
      offersHandConstraint: true
    });
    entity.setAttribute("body-helper", {
      type: TYPE.DYNAMIC,
      mass: 1,
      collisionFilterGroup: COLLISION_LAYERS.INTERACTABLES,
      collisionFilterMask: COLLISION_LAYERS.DEFAULT_INTERACTABLE
    });
    entity.setAttribute("matrix-auto-update", "");
    entity.setAttribute("shape-helper", { shape: SHAPE.BOX });
    entity.setAttribute("set-unowned-body-kinematic", "");
    entity.setAttribute("floaty-object", {
      modifyGravityOnRelease: true,
      autoLockOnLoad: true,
      gravitySpeedLimit: 0,
      reduceAngularFloat: true
    });
    this.scene.appendChild(entity);
  };
}
