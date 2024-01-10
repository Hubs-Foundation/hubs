import { defineQuery, enterQuery, exitQuery, removeEntity } from "bitecs";
import { FloorMap } from "../bit-components";
import { addFloorMap } from "../prefabs/floor-map";
import { anyEntityWith } from "../utils/bit-utils";
import { createRef } from "../utils/jsx-entity";
import { Vector3 } from "three";
import { GetProperties, PropertyType } from "../utils/rooms-properties";

const mapQuery = defineQuery([FloorMap]);
const enterMapQuery = enterQuery(mapQuery);
const exitMapQuery = exitQuery(mapQuery);

class FloorMapClass {
  constructor() {
    this.obj = null;
    this.eid = null;
  }

  async Init(hubID) {
    this.userPov = document.querySelector("#avatar-pov-node").object3D;
    this.userObj = document.querySelector("#avatar-rig").object3D;
    const mapProperties = await GetProperties(hubID, PropertyType.MAP);

    if (!mapProperties) {
      console.error("Cannot read map properties, map is not enabled for this room");
      this.enabled = false;
      this.file = "https://kontopoulosdm.github.io/unavailable_map.png";
      this.imageRatio = 0.5;
    } else {
      this.enabled = true;
      this.imageRatio = mapProperties.ratio;
      this.mapToImage = mapProperties.mapToImage;
      this.file = mapProperties.file;
      this.roomLength = mapProperties.roomLength;
      this.center = mapProperties.center;
      this.centerOffset = mapProperties.centeroffset;
    }

    APP.scene.addEventListener("map-toggle", () => {
      if (this.Active()) {
        APP.scene.remove(this.obj);
        removeEntity(APP.world, this.eid);
        APP.scene.removeState("map");
      } else {
        const MapPos = new Vector3(0, 0, -1);
        APP.scene.addState("map");
        this.imageSize = addFloorMap(APP.world, MapPos, this.imageRatio, this.file);
        console.log(this.imageSize);
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

      if (this.enabled) {
        this.ratio = new Vector3(
          (this.mapToImage[0] * this.imageSize.x) / this.roomLength[0],
          1,
          -(this.mapToImage[1] * this.imageSize.y) / this.roomLength[1]
        );
      } else {
        console.log("the point is removed because the map is disabled");
        this.obj.remove(this.pointObj);
      }
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
    const scalarPos = new Vector3(
      (userPosition.x + this.centerOffset[0]) * this.ratio.x,
      userPosition.y * this.ratio.y,
      (userPosition.z + this.centerOffset[1]) * this.ratio.z
    );
    this.pointObj.position.copy(new Vector3(scalarPos.x + this.center[0], scalarPos.z + this.center[1], 0.01));

    this.userObj.updateMatrix();
    this.pointObj.rotation.z = this.userObj.rotation.y;
    this.pointObj.updateMatrix();
    this.obj.updateMatrix();
  }
}

export const floorMap = new FloorMapClass();

export function FloorMapSystem(world) {
  if (!floorMap.Active() || !floorMap.enabled) return;

  console.log("the floor map system movement works");

  floorMap.Movement();
}
