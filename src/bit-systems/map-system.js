import { defineQuery, enterQuery, exitQuery, removeEntity } from "bitecs";
import { FloorMap } from "../bit-components";
import { addFloorMap } from "../prefabs/floor-map";
import { Vector3 } from "three";

const mapQuery = defineQuery([FloorMap]);
const enterMapQuery = enterQuery(mapQuery);
const exitMapQuery = exitQuery(mapQuery);

class FloorMapClass {
  constructor() {
    this.obj = null;
    this.eid = null;
    this.file = null;
    this.imageRatio = 0.5;
    this.allowed = false;
    this.initialized = false;
  }

  Init(hubProperties) {
    const onMapToggle = () => {
      if (this.Active()) {
        APP.scene.remove(this.obj);
        removeEntity(APP.world, this.eid);
        APP.scene.removeState("map");
      } else {
        APP.scene.addState("map");
        this.imageSize = addFloorMap(APP.world, this.imageRatio, this.file);
        console.log(this.imageSize);
      }
    };

    if (this.initialized) {
      APP.scene.removeEventListener("map-toggle", onMapToggle());
      this.initialized = false;
      if (this.Active()) onMapToggle();
    }
    if (hubProperties.allow_map) {
      this.allowed = true;
      this.userPov = document.querySelector("#avatar-pov-node").object3D;
      this.userObj = document.querySelector("#avatar-rig").object3D;

      const mapProperties = hubProperties.map;
      this.imageRatio = mapProperties.ratio;
      this.mapToImage = mapProperties.mapToImage;
      this.file = mapProperties.file;
      this.roomLength = mapProperties.roomLength;
      this.center = mapProperties.center;
      this.centerOffset = mapProperties.centeroffset;
      this.initialized = true;
    }

    APP.scene.addEventListener("map-toggle", onMapToggle());
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

      if (this.allowed) {
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
  if (!floorMap.Active() || !floorMap.allowed) return;
  floorMap.Movement();
}
