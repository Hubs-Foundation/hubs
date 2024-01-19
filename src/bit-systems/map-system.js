import { defineQuery, enterQuery, exitQuery, removeEntity } from "bitecs";
import { FloorMap } from "../bit-components";
import { FloorMapPanel, addFloorMap } from "../prefabs/floor-map";
import { Vector3 } from "three";
import { renderAsEntity } from "../utils/jsx-entity";

const mapQuery = defineQuery([FloorMap]);
const enterMapQuery = enterQuery(mapQuery);
const exitMapQuery = exitQuery(mapQuery);

class FloorMapClass {
  constructor() {
    this.obj = null;
    this.eid = null;
    this.file = null;
    this.imageRatio = 0.5;
    this.allowed = null;
    this.initialized = false;
  }

  Init(hubProperties) {
    const mapToggle = () => {
      if (APP.scene.is("map")) {
        this.Remove();
      } else {
        this.Instantiate();
      }
    };

    if (this.initialized) {
      APP.scene.removeEventListener("map-toggle", mapToggle);
      this.obj = null;
      this.eid = null;
      this.file = null;
      this.imageRatio = 0.5;
      this.allowed = null;
      this.initialized = false;
    }

    if (!hubProperties.allow_map) {
      console.warn("No available map for this room");
      this.allowed = false;
      return;
    }

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

    APP.scene.addEventListener("map-toggle", mapToggle);
  }

  Instantiate() {
    APP.scene.addState("map");
    const eid = renderAsEntity(APP.world, FloorMapPanel(this.imageRatio, this.file));
    const obj = APP.world.eid2obj.get(eid);
    var boundingBox = new THREE.Box3();
    boundingBox.setFromObject(obj);
    var boundingBoxSize = new THREE.Vector3();
    boundingBox.getSize(boundingBoxSize);
    APP.world.scene.add(obj);
    this.imageSize = boundingBoxSize;
  }

  Remove() {
    APP.scene.remove(this.obj);
    removeEntity(APP.world, this.eid);
    APP.scene.removeState("map");
  }

  Setup(mapEid) {
    this.eid = mapEid;
    this.obj = APP.world.eid2obj.get(mapEid);
    this.pointEID = FloorMap.pointRef[mapEid];
    this.pointObj = APP.world.eid2obj.get(this.pointEID);

    if (this.allowed) {
      this.ratio = new Vector3(
        (this.mapToImage[0] * this.imageSize.x) / this.roomLength[0],
        1,
        -(this.mapToImage[1] * this.imageSize.y) / this.roomLength[1]
      );
    } else {
      this.obj.remove(this.pointObj);
    }
  }

  Cleanup() {
    this.eid = null;
    this.pointEID = null;
    this.obj = null;
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
  enterMapQuery(APP.world).forEach(mapEid => {
    floorMap.Setup(mapEid);
  });
  exitMapQuery(APP.world).forEach(mapEid => {
    floorMap.Cleanup();
  });
  mapQuery(APP.world).forEach(_ => {
    if (!floorMap.allowed) return;
    floorMap.Movement();
  });
}
