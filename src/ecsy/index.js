import { World } from "ecsy";
import { Object3D, Parent, ParentObject3D, Position, Rotation, Scale, Scene, Transform } from "ecsy-three";
import { InitSceneSystem } from "./systems/InitSceneSystem";
import { RotationSystem } from "./systems/RotationSystem";
import { HubsTransformSystem } from "./systems/HubsTransformSystem";
import { Rotating } from "./components/Rotating";

export class WorldManager {
  constructor(aframeScene) {
    this.aframeScene = aframeScene;
    this.world = new World();
    this.initialized = false;
  }

  init() {
    this.world
      .registerComponent(Object3D)
      .registerComponent(Parent)
      .registerComponent(ParentObject3D)
      .registerComponent(Position)
      .registerComponent(Rotating)
      .registerComponent(Rotation)
      .registerComponent(Scale)
      .registerComponent(Scene)
      .registerComponent(Transform);

    this.world
      .registerSystem(InitSceneSystem)
      .registerSystem(RotationSystem)
      .registerSystem(HubsTransformSystem);

    this.world
      .createEntity()
      .addComponent(Scene)
      .addComponent(Object3D, { value: this.aframeScene.object3D });

    this.initialized = true;
  }

  execute(dt, time) {
    // Call init after hubs-systems are initialized and DOMContentLoaded has been fired.
    if (!this.initialized) {
      this.init();
    }

    this.world.execute(dt / 1000, time);
  }
}
