import { Component, System, MeshEntity } from "hubs";
import { Vector3, MeshBasicMaterial, BoxBufferGeometry } from "three";

class RotateComponent extends Component {
  static schema = {
    axis: { type: Vector3, default: new Vector3(0, 1, 0) },
    speed: { type: Number, default: 0.5 }
  };
}

class RotateSystem extends System {
  update(dt) {
    const entities = this.world.entitiesByComponent.get(RotateComponent);

    entities.forEach(entity => {
      const rotate = entity.getComponent(RotateComponent);
      entity.rotateOnAxis(rotate.axis, rotate.speed * (dt / 1000));
      entity.matrixNeedsUpdate = true;
    });
  }
}

export default function config(world) {
  world.registerComponent(RotateComponent);
  world.registerSystem(RotateSystem);

  const entity = new MeshEntity(new BoxBufferGeometry(), new MeshBasicMaterial());
  world.root.add(entity);
  entity.addComponent(RotateComponent);
}
