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
        const avatarDirection = this.userPov.getWorldDirection(new Vector3());
        const povPosition = this.userPov.getWorldPosition(new THREE.Vector3());
        const correctedAvatarDirection = new Vector3(avatarDirection.x, 0, avatarDirection.z);
        const MapPos = new Vector3().addVectors(povPosition, correctedAvatarDirection.normalize().multiplyScalar(-1));

        APP.scene.addState("map");
        addFloorMap(APP.world, MapPos, povPosition);
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
    exitMapQuery(APP.world).forEach(exitEID => {
      this.eid = null;
      this.pointEID = null;
      this.obj = null;
    });

    return this.eid;
  }

  Movement() {
    const mapPosition = this.obj.getWorldPosition(new THREE.Vector3());
    const povPosition = this.userPov.getWorldPosition(new THREE.Vector3());
    const userPosition = this.userObj.getWorldPosition(new THREE.Vector3());
    const dist = mapPosition.distanceTo(povPosition);

    if (dist > 1) {
      const dir = new THREE.Vector3().subVectors(povPosition, mapPosition).normalize();
      const newPos = new THREE.Vector3().copy(povPosition.sub(dir.multiplyScalar(1)));
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
