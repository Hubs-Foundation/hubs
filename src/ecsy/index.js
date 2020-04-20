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
import { CursorController } from "./components/CursorController";
import { Interactor } from "./components/Interactor";
import { Raycaster } from "./components/Raycaster";
import { Grabbable } from "./components/Grabbable";
import { RaycastInteractor } from "./components/RaycastInteractor";
import { HandController } from "./components/HandController";
import { PhysicsInteractor } from "./components/PhysicsInteractor";
import { PhysicsBody } from "./components/PhysicsBody";
import { ActionFrame } from "./components/ActionFrame";
import { AFrameEntity } from "./components/AFrameEntity";
import { GLTFModel } from "./components/GLTFModel";
import { InteractionSystem } from "./systems/InteractionSystem";

import { paths } from "../systems/userinput/paths";
import { CursorControllerSystem } from "./systems/CursorControllerSystem";

export class WorldManager {
  constructor(aframeScene) {
    this.aframeScene = aframeScene;
    this.world = new World();
    this.initialized = false;
  }

  init() {
    this.world
      .registerComponent(ActionFrame)
      .registerComponent(AFrameEntity)
      .registerComponent(Animation)
      .registerComponent(CursorController)
      .registerComponent(GLTFLoader)
      .registerComponent(GLTFModel)
      .registerComponent(Grabbable)
      .registerComponent(HandController)
      .registerComponent(Image)
      .registerComponent(Interactable)
      .registerComponent(Interactor)
      .registerComponent(Loading)
      .registerComponent(LoadingCube)
      .registerComponent(MediaLoader)
      .registerComponent(Object3D)
      .registerComponent(Parent)
      .registerComponent(ParentObject3D)
      .registerComponent(PhysicsBody)
      .registerComponent(PhysicsInteractor)
      .registerComponent(Position)
      .registerComponent(Raycaster)
      .registerComponent(RaycastInteractor)
      .registerComponent(Rotating)
      .registerComponent(Rotation)
      .registerComponent(Scale)
      .registerComponent(Scene)
      .registerComponent(Transform);

    this.world
      .registerSystem(InteractionSystem)
      .registerSystem(CursorControllerSystem)
      .registerSystem(InitSceneSystem)
      .registerSystem(MediaLoaderSystem)
      .registerSystem(ImageSystem)
      .registerSystem(LoadingCubeSystem)
      .registerSystem(GLTFLoaderSystem)
      .registerSystem(AnimationSystem)
      .registerSystem(RotationSystem)
      .registerSystem(HubsTransformSystem);

    this.scene = this.world
      .createEntity()
      .addComponent(Scene)
      .addComponent(AFrameEntity, { value: this.aframeScene })
      .addComponent(Object3D, { value: this.aframeScene.object3D })
      .addComponent(ActionFrame, { value: this.aframeScene.systems["userinput"].frame });

    const leftCursorControllerEl = document.getElementById("left-cursor-controller");

    this.leftCursorController = this.world
      .createEntity()
      .addComponent(AFrameEntity, { value: leftCursorControllerEl })
      .addComponent(Object3D, { value: leftCursorControllerEl.object3D })
      .addComponent(CursorController, { id: "left" })
      .addComponent(Interactor, {
        grabStartActionPath: paths.actions.leftHand.grab,
        grabEndActionPath: paths.actions.leftHand.drop
      })
      .addComponent(RaycastInteractor)
      .addComponent(Raycaster, { value: leftCursorControllerEl.components["cursor-controller"].raycaster });

    const rightCursorControllerEl = document.getElementById("right-cursor-controller");

    this.rightCursorController = this.world
      .createEntity()
      .addComponent(AFrameEntity, { value: rightCursorControllerEl })
      .addComponent(Object3D, { value: rightCursorControllerEl.object3D })
      .addComponent(CursorController, { id: "right" })
      .addComponent(Interactor, {
        grabStartActionPath: paths.actions.rightHand.grab,
        grabEndActionPath: paths.actions.rightHand.drop
      })
      .addComponent(RaycastInteractor)
      .addComponent(Raycaster, { value: rightCursorControllerEl.components["cursor-controller"].raycaster });

    const leftControllerEl = document.getElementById("player-left-controller");

    this.leftHandController = this.world
      .createEntity()
      .addComponent(AFrameEntity, { value: leftControllerEl })
      .addComponent(Object3D, { value: leftControllerEl.object3D })
      .addComponent(HandController, { id: "left" })
      .addComponent(Interactor, {
        grabStartActionPath: paths.actions.leftHand.grab,
        grabEndActionPath: paths.actions.leftHand.drop
      })
      .addComponent(PhysicsInteractor)
      .addComponent(PhysicsBody);

    const rightControllerEl = document.getElementById("player-right-controller");

    this.rightHandController = this.world
      .createEntity()
      .addComponent(AFrameEntity, { value: rightControllerEl })
      .addComponent(Object3D, { value: rightControllerEl.object3D })
      .addComponent(HandController, { id: "right" })
      .addComponent(Interactor, {
        grabStartActionPath: paths.actions.rightHand.grab,
        grabEndActionPath: paths.actions.rightHand.drop
      })
      .addComponent(PhysicsInteractor)
      .addComponent(PhysicsBody);

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
