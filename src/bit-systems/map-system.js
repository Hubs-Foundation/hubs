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
  }

  Init() {
    this.avatarPovObj = document.querySelector("#avatar-pov-node").object3D;
    APP.scene.addEventListener("map-toggle", () => {
      if (this.Active()) {
        APP.scene.remove(this.obj);
        removeEntity(APP.world, this.eid);
        APP.scene.removeState("map");
      } else {
        const avatarDirection = this.avatarPovObj.getWorldDirection(new Vector3());
        const userPosition = this.avatarPovObj.getWorldPosition(new THREE.Vector3());
        const MapPos = new Vector3().addVectors(userPosition, avatarDirection.normalize().multiplyScalar(-2));

        APP.scene.addState("map");
        addFloorMap(APP.world, MapPos, userPosition);
      }
    });
  }

  Active() {
    enterMapQuery(APP.world).forEach(mapEID => {
      if (APP.scene.is("agent")) {
        APP.scene.emit("agent-toggle");
        console.log("Agent toggled before Map spawn");
      }
      this.eid = mapEID;
      this.obj = APP.world.eid2obj.get(mapEID);
      this.pointEID = FloorMap.pointRef[mapEID];
      this.pointObj = APP.world.eid2obj.get(this.pointEID);
      console.log("Map spawn");
    });
    exitMapQuery(APP.world).forEach(exitEID => {
      console.log("Map removing");
      this.eid = null;
      this.pointEID = null;
      this.obj = null;
    });

    return this.eid;
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

    const scalarPos = userPosition.multiplyScalar(0.02);
    this.pointObj.position.copy(new Vector3(scalarPos.x, scalarPos.z, 0.01));

    this.pointObj.updateMatrix();
    this.obj.updateMatrix();
  }
}

export const floorMap = new FloorMapClass();

export function FloorMapSystem(world) {
  if (!floorMap.Active()) return;

  floorMap.Movement();
}
