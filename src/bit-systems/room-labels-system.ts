import { Object3D } from "three";
import { roomPropertiesReader } from "../utils/rooms-properties";
import { renderAsEntity } from "../utils/jsx-entity";
import { SimpleImagePanel } from "../prefabs/tutorial-panels";
import { removeEntity } from "bitecs";

class SceneObject {
  ref: number;
  obj: Object3D;

  constructor(ref: number | null = null, obj: Object3D | null = null) {
    if (ref) {
      this.ref = ref;
      this.obj = APP.world.eid2obj.get(this.ref)!;
    } else if (obj) this.obj = obj;
  }
}

class RoomLabelOrganizer {
  labels: Array<SceneObject>;

  constructor() {
    this.labels = new Array<SceneObject>();
  }
  Init() {
    this.labels.forEach(label => {
      APP.world.scene.remove(label.obj);
      removeEntity(APP.world, label.ref);
    });
    this.labels = new Array<SceneObject>();

    roomPropertiesReader.labelProps.forEach((label, index) => {
      const image = roomPropertiesReader.serverURL.concat("/", roomPropertiesReader.Room, `/label_${index}`, ".png");
      const ref = renderAsEntity(
        APP.world,
        SimpleImagePanel(image, label.name, label.position, label.rotation, label.scale, label.ratio)
      );

      const labelEntity = new SceneObject(ref);
      APP.world.scene.add(labelEntity.obj);
      this.labels.push(labelEntity);
    });
  }
}

export const labelOrganizer = new RoomLabelOrganizer();
