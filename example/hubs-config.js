import { Component, System, MeshEntity, ImageEntity, InteractableComponent, NetworkedComponent } from "hubs";
import { Vector3, MeshBasicMaterial, BoxBufferGeometry } from "three";

class RotateComponent extends Component {
  static schema = {
    axis: { type: Vector3, default: new Vector3(0, 1, 0) },
    speed: { type: Number, default: 0.5 }
  };
}

class RotateOnHeldComponent extends Component {}

class NetworkedRotationComponent extends Component {}

class RotateSystem extends System {
  update(dt) {
    const entities = this.world.entitiesByComponent.get(RotateComponent);

    entities.forEach(entity => {
      const rotate = entity.getComponent(RotateComponent);
      entity.rotateOnAxis(rotate.axis, rotate.speed * (dt / 1000));
    });
  }
}

class RotateOnHeldSystem extends System {
  update() {
    const entities = this.world.entitiesByComponent.get(RotateOnHeldComponent);

    entities.forEach(entity => {
      const interactable = entity.getComponent(InteractableComponent);

      if (!interactable) {
        return;
      }

      const held = interactable.held;
      const hasRotateComponent = entity.hasComponent(RotateComponent);

      if (held && !hasRotateComponent) {
        const component = entity.addComponent(RotateComponent);
        component.speed = 1;
      } else if (!held && hasRotateComponent) {
        entity.removeComponent(RotateComponent);
      }
    });
  }
}

class NetworkedRotationSystem extends System {
  update() {
    const entities = this.world.entitiesByComponent.get(NetworkedRotationComponent);

    entities.forEach(entity => {
      const networked = entity.getComponent(NetworkedComponent);

      if (networked.owner === NAF.clientId) {
        if (!networked.data.r) {
          networked.data.r = [];
        }

        entity.rotation.toArray(networked.data.r);
      }
    });
  }
}

export default function config(world) {
  world.registerComponent(RotateComponent);
  world.registerComponent(RotateOnHeldComponent);
  world.registerComponent(NetworkedRotationComponent);

  world.registerSystem(RotateOnHeldSystem);
  world.registerSystem(RotateSystem);
  world.registerSystem(NetworkedRotationSystem);

  const spinningCubeEntity = new MeshEntity(new BoxBufferGeometry(), new MeshBasicMaterial());
  spinningCubeEntity.addComponent(RotateComponent);
  world.root.add(spinningCubeEntity);

  const imageEntity = new ImageEntity();
  imageEntity.src =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Firefox_logo%2C_2019.svg/1200px-Firefox_logo%2C_2019.svg.png";
  imageEntity.position.y = 3;
  imageEntity.addComponent(InteractableComponent);
  imageEntity.addComponent(RotateOnHeldComponent);

  const networked = imageEntity.addComponent(NetworkedComponent);
  networked.id = "image";
  networked.owner = "scene";

  imageEntity.addComponent(NetworkedRotationComponent);

  world.root.add(imageEntity);
}
