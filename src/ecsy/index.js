import { World } from "ecsy";
import { Object3D, Parent, ParentObject3D, Position, Rotation, Scale, Scene, Transform } from "ecsy-three";
import { InitSceneSystem } from "./systems/InitSceneSystem";
import { MediaLoaderSystem } from "./systems/MediaLoaderSystem";
import { RotationSystem } from "./systems/RotationSystem";
import { HubsTransformSystem } from "./systems/HubsTransformSystem";
import { Rotating } from "./components/Rotating";
import { Animation } from "./components/Animation";
import { GLTFLoader } from "./components/GLTFLoader";
import { Image } from "./components/Image";
import { Interactable } from "./components/Interactable";
import { Loading } from "./components/Loading";
import { LoadingCube } from "./components/LoadingCube";
import { MediaLoader } from "./components/MediaLoader";
import { AnimationSystem } from "./systems/AnimationSystem";
import { GLTFLoaderSystem } from "./systems/GLTFLoaderSystem";
import { LoadingCubeSystem } from "./systems/LoadingCubeSystem";
import { ImageSystem } from "./systems/ImageSystem";

export class WorldManager {
  constructor(aframeScene) {
    this.aframeScene = aframeScene;
    this.world = new World();
    this.initialized = false;
  }

  init() {
    this.world
      .registerComponent(Animation)
      .registerComponent(GLTFLoader)
      .registerComponent(Image)
      .registerComponent(Interactable)
      .registerComponent(Loading)
      .registerComponent(LoadingCube)
      .registerComponent(MediaLoader)
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
      .registerSystem(MediaLoaderSystem)
      .registerSystem(ImageSystem)
      .registerSystem(LoadingCubeSystem)
      .registerSystem(GLTFLoaderSystem)
      .registerSystem(AnimationSystem)
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
