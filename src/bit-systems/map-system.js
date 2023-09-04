import { defineQuery, enterQuery, exitQuery, removeEntity } from "bitecs";
import { FloorMap } from "../bit-components";
import { addFloorMap } from "../prefabs/floor-map";
import { anyEntityWith } from "../utils/bit-utils";
import { createRef } from "../utils/jsx-entity";
import { Vector3 } from "three";

const mapQuery = defineQuery([FloorMap]);
const enterMapQuery = enterQuery(mapQuery);
const exitMapQuery = exitQuery(mapQuery);

class FloorMapClass {
  constructor() {
    this.obj = null;
    this.eid = null;
    this.wasAgent = null;
  }

  Init() {
    APP.scene.addEventListener("map-toggle", () => {
      this.eid = anyEntityWith(APP.world, FloorMap);
      this.avatarPovObj = document.querySelector("#avatar-pov-node").object3D;

      if (this.eid) {
        const mapObj = APP.world.eid2obj.get(this.eid);
        APP.scene.remove(mapObj);
        removeEntity(APP.world, this.eid);
        APP.scene.removeState("map");
        this.obj = null;
        this.eid = null;

        // if (this.wasAgent) APP.scene.emit("agent-toggle");
      } else {
        this.avatarDirection = this.avatarPovObj.getWorldDirection(new Vector3());
        const userPosition = this.avatarPovObj.getWorldPosition(new THREE.Vector3());
        const MapPos = new Vector3().addVectors(userPosition, this.avatarDirection.normalize().multiplyScalar(-2));
        APP.scene.addState("map");
        this.eid = addFloorMap(APP.world, MapPos);
        this.obj = APP.world.eid2obj.get(this.eid);

        if (APP.scene.is("agent")) {
          this.wasAgent = true;
          // APP.scene.emit("agent-toggle");
        } else {
          this.wasAgent = false;
        }
      }
    });
  }

  Movement() {
    const mapPosition = this.obj.getWorldPosition(new THREE.Vector3());
    const userPosition = this.avatarPovObj.getWorldPosition(new THREE.Vector3());
    const dist = mapPosition.distanceTo(userPosition);

    if (dist > 2) {
      const dir = new THREE.Vector3().subVectors(userPosition, mapPosition).normalize();
      const newPos = new THREE.Vector3().copy(userPosition.sub(dir.multiplyScalar(2)));
      this.obj.position.copy(newPos);
    }

    if (dist < 0.3) {
      this.obj.visible = false;
    } else {
      this.obj.visible = true;
    }
  }
}

export const floorMap = new FloorMapClass();

export function FloorMapSystem(world) {
  if (!APP.scene.is("map")) return;

  floorMap.Movement();
  floorMap.obj.updateMatrix();
}
