import { addComponent, defineQuery, enterQuery, exitQuery, removeComponent, removeEntity } from "bitecs";
import { CursorRaycastable, FloorMap } from "../bit-components";
import { FloorMapPanel } from "../prefabs/floor-map";
import { AxesHelper, Object3D, Vector2, Vector3 } from "three";
import { renderAsEntity } from "../utils/jsx-entity";
import { roomPropertiesReader } from "../utils/rooms-properties";
import { AElement, AScene } from "aframe";
import { languageCodes, translationSystem } from "./translation-system";
import { HubsWorld } from "../app";
import { radToDeg } from "three/src/math/MathUtils";
import { logger } from "./logging-system";
import { faSlash } from "@fortawesome/free-solid-svg-icons";

const mapQuery = defineQuery([FloorMap]);
const enterMapQuery = enterQuery(mapQuery);
const exitMapQuery = exitQuery(mapQuery);

class FloorMapClass {
  pointerObj: Object3D;
  titleObj: Object3D;
  entityObj: Object3D;
  mapObj: Object3D;
  userPov: Object3D;
  userObj: Object3D;
  mapParentObj: Object3D;

  mapParentRef: number;
  entityRef: number;
  mapRef: number;
  pointerRef: number;
  imageRatio: number;
  scale: number;
  movingScalar: number;

  mapDir: Vector3;
  imageSize: Vector2;
  roomSize: Vector2;

  allowed: boolean;

  AScene: AScene;

  constructor() {
    this.onToggle = this.onToggle.bind(this);
    this.onClear = this.onClear.bind(this);
    this.Init = this.Init.bind(this);
  }

  Init(reset: boolean) {
    if (reset) {
      this.AScene.removeEventListener("map-toggle", this.onToggle);
      this.AScene.addEventListener("clear-scene", this.onClear);
      this.Remove();
    }

    if (!roomPropertiesReader.AllowsMap) {
      console.warn("No available map for this room");
      this.allowed = false;
      return;
    }

    this.AScene = APP.scene as AScene;
    this.AScene.addEventListener("map-toggle", this.onToggle);
    this.AScene.addEventListener("clear-scene", this.onClear);
    this.allowed = true;
    this.userPov = (document.querySelector("#avatar-pov-node")! as AElement).object3D;
    this.userObj = (document.querySelector("#avatar-rig")! as AElement).object3D;
    this.roomSize = new Vector2(
      roomPropertiesReader.mapProps.room_size![0],
      roomPropertiesReader.mapProps.room_size![1]
    );
    this.imageRatio = roomPropertiesReader.mapProps.image_ratio!;
    this.scale = roomPropertiesReader.mapProps.scale!;

    this.Instantiate();
  }

  Instantiate() {
    const language = translationSystem.mylanguage as "english" | "spanish" | "german" | "dutch" | "greek" | "italian";
    const languageCode = languageCodes[language];

    const mapImage = `${roomPropertiesReader.serverURL}/${roomPropertiesReader.Room}/${languageCode}_map.png`;
    this.entityRef = renderAsEntity(APP.world, FloorMapPanel(this.imageRatio, mapImage, this.scale));
    this.entityObj = APP.world.eid2obj.get(this.entityRef)!;
    this.imageSize = this.GetObjSize(this.entityObj);
    APP.world.scene.add(this.entityObj);
    this.mapDir = new Vector3(0, 0, -1);
    this.movingScalar = this.imageRatio <= 1 ? 1 / this.roomSize.x : 1 / this.roomSize.y;
    this.entityObj.visible = false;
  }

  Enable() {
    if (this.AScene.is("map")) return;
    this.AScene.addState("map");
    this.mapObj.position.copy(new Vector3(0, 0, 0));
    this.mapObj.rotation.set(0, 0, 0);
    this.mapObj.updateMatrix();
    this.entityObj.visible = true;
    addComponent(APP.world, CursorRaycastable, this.mapRef);
  }

  Disable() {
    if (!this.AScene.is("map")) return;
    this.AScene.removeState("map");
    this.entityObj.visible = false;
    removeComponent(APP.world, CursorRaycastable, this.mapRef);
  }

  Remove() {
    this.Disable();
    APP.world.scene.remove(this.entityObj);
    removeEntity(APP.world, this.entityRef);
  }

  Setup(world: HubsWorld, mapRef: number) {
    this.mapRef = mapRef;
    this.mapObj = world.eid2obj.get(mapRef)!;
    this.pointerRef = FloorMap.pointRef[mapRef];
    this.pointerObj = world.eid2obj.get(this.pointerRef)!;
  }

  Movement() {
    const userPosition = this.userObj.getWorldPosition(new THREE.Vector3());
    this.pointerObj.position.copy(
      new Vector3(
        -(userPosition.x * this.movingScalar - (0.5 * this.imageSize.x) / this.scale),
        userPosition.z * this.movingScalar - (0.5 * this.imageSize.y) / this.scale,
        0.01
      )
    );

    const orientation = this.userPov.getWorldDirection(new Vector3()).setY(this.mapDir.y).normalize();
    const crossProd = orientation.clone().cross(this.mapDir);
    const sign = crossProd.y > 0 ? 1 : -1;
    const dotAngle = orientation.angleTo(this.mapDir);

    this.pointerObj.rotation.set(0, 0, -dotAngle * sign);
    this.pointerObj.updateMatrix();

    // console.log(
    //   `(${userPosition.x}, ${userPosition.z}, (${this.pointerObj.position.x}, ${this.pointerObj.position.y}))`
    // );
  }

  GetObjSize(obj: Object3D): Vector2 {
    const boundingBox = new THREE.Box3();
    boundingBox.setFromObject(obj);
    const boundingBoxSize = new THREE.Vector3();
    boundingBox.getSize(boundingBoxSize);

    return new Vector2(boundingBoxSize.x, boundingBoxSize.y);
  }

  onToggle() {
    if (this.AScene.is("map")) {
      this.Disable();
      // logger.AddUiInteraction("map_toggle", "deactivate_map");
    } else {
      this.AScene.emit("clear-scene");
      this.Enable();
      // logger.AddUiInteraction("map_toggle", "activate_map");
    }
  }

  onClear() {
    if (this.AScene.is("map")) {
      this.Disable();
    }
  }
}

export const floorMap = new FloorMapClass();

export function FloorMapSystem(world: HubsWorld) {
  enterMapQuery(world).forEach(mapEid => {
    floorMap.Setup(world, mapEid);
  });

  mapQuery(world).forEach(_ => {
    if (!floorMap.allowed) return;
    floorMap.Movement();
  });
}
