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
    this.userPov = document.querySelector("#avatar-pov-node").object3D;
    this.userObj = document.querySelector("#avatar-rig").object3D;
    APP.scene.addEventListener("map-toggle", () => {
      if (this.Active()) {
        APP.scene.remove(this.obj);
        removeEntity(APP.world, this.eid);
        APP.scene.removeState("map");
      } else {
        const povPosition = this.userPov.getWorldPosition(new THREE.Vector3());
        const MapPos = new Vector3(0, 0, -1);
        APP.scene.addState("map");
        addFloorMap(APP.world, MapPos, povPosition, this.userPov);
      }
    });
  }

  Active() {
    enterMapQuery(APP.world).forEach(mapEID => {
      if (APP.scene.is("agent")) {
        APP.scene.emit("agent-toggle");
      }
      this.eid = mapEID;
      this.obj = APP.world.eid2obj.get(mapEID);
      this.pointEID = FloorMap.pointRef[mapEID];
      this.pointObj = APP.world.eid2obj.get(this.pointEID);
    });
    exitMapQuery(APP.world).forEach(() => {
      this.eid = null;
      this.pointEID = null;
      this.obj = null;
    });

    return this.eid;
  }

  Movement() {
    const userPosition = this.userObj.getWorldPosition(new THREE.Vector3());
    const scalarPos = userPosition.multiplyScalar(0.04);
    this.pointObj.position.copy(new Vector3(scalarPos.x - 0.5, -scalarPos.z - 0.5, 0.01));

    this.pointObj.updateMatrix();
    this.obj.updateMatrix();
  }
}

export const floorMap = new FloorMapClass();

export function FloorMapSystem(world) {
  if (!floorMap.Active()) return;

  floorMap.Movement();
}
