import {
  ThreeWorld,
  SceneEntity,
  BoneEntity,
  GroupEntity,
  Object3DEntity,
  SkinnedMeshEntity,
  MeshEntity,
  LineSegmentsEntity,
  LineEntity,
  LineLoopEntity,
  PointsEntity,
  PerspectiveCameraEntity,
  OrthographicCameraEntity,
  AmbientLightEntity,
  DirectionalLightEntity,
  HemisphereLightEntity,
  PointLightEntity,
  SpotLightEntity
} from "ecsy-three";

import { Rotating } from "./components/Rotating";
import { Animation } from "./components/Animation";
import { GLTFLoader } from "./components/GLTFLoader";
import { Image } from "./components/Image";
import { Interactable } from "./components/Interactable";
import { Loading } from "./components/Loading";
import { LoadingCube } from "./components/LoadingCube";
import { MediaLoader } from "./components/MediaLoader";
import { CursorController } from "./components/CursorController";
import { Interactor } from "./components/Interactor";
import { Raycaster } from "./components/Raycaster";
import { Grabbable } from "./components/Grabbable";
import { RaycastInteractor } from "./components/RaycastInteractor";
import { HandController } from "./components/HandController";
import { PhysicsInteractor } from "./components/PhysicsInteractor";
import { PhysicsBody } from "./components/PhysicsBody";
import { PhysicsShape } from "./components/PhysicsShape";
import { ActionFrame } from "./components/ActionFrame";
import { AFrameEntity } from "./components/AFrameEntity";
import { GLTFModel } from "./components/GLTFModel";
import { SpawnPoint } from "./components/SpawnPoint";

import { InitSceneSystem } from "./systems/InitSceneSystem";
import { RotationSystem } from "./systems/RotationSystem";

import { paths } from "../systems/userinput/paths";
import { sets } from "../systems/userinput/sets";

//import { CursorControllerSystem } from "./systems/CursorControllerSystem";

export class WorldManager {
  constructor(aframeScene) {
    this.aframeScene = aframeScene;
    this.world = new ThreeWorld();
    this.initialized = false;
  }

  init() {
    this.world
      .registerEntityType(SceneEntity)
      .registerEntityType(BoneEntity)
      .registerEntityType(GroupEntity)
      .registerEntityType(Object3DEntity)
      .registerEntityType(SkinnedMeshEntity)
      .registerEntityType(MeshEntity)
      .registerEntityType(LineSegmentsEntity)
      .registerEntityType(LineEntity)
      .registerEntityType(LineLoopEntity)
      .registerEntityType(PointsEntity)
      .registerEntityType(PerspectiveCameraEntity)
      .registerEntityType(OrthographicCameraEntity)
      .registerEntityType(AmbientLightEntity)
      .registerEntityType(DirectionalLightEntity)
      .registerEntityType(HemisphereLightEntity)
      .registerEntityType(PointLightEntity)
      .registerEntityType(SpotLightEntity)
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
      .registerComponent(PhysicsBody)
      .registerComponent(PhysicsShape)
      .registerComponent(PhysicsInteractor)
      .registerComponent(Raycaster)
      .registerComponent(RaycastInteractor)
      .registerComponent(Rotating)
      .registerComponent(SpawnPoint);

    this.world
      // .registerSystem(InteractionSystem)
      // .registerSystem(CursorControllerSystem)
      .registerSystem(InitSceneSystem)
      // .registerSystem(MediaLoaderSystem)
      // .registerSystem(ImageSystem)
      // .registerSystem(LoadingCubeSystem)
      // .registerSystem(GLTFLoaderSystem)
      // .registerSystem(AnimationSystem)
      .registerSystem(RotationSystem);
    // .registerSystem(PhysicsSystem, { hubsSystem: this.aframeScene.systems["hubs-systems"].physicsSystem });

    this.scene = new SceneEntity(this.world); //.addComponent(ActionFrame, { value: this.aframeScene.systems["userinput"].frame });
    this.aframeScene.object3D.add(this.scene);
    this.world.addEntity(this.scene);

    const leftCursorControllerEl = document.getElementById("left-cursor-controller");

    this.leftCursorController = this.world
      .createEntity()
      .addComponent(AFrameEntity, { value: leftCursorControllerEl })
      .addComponent(CursorController, { id: "left" })
      .addComponent(Interactor, {
        hoverActionSet: sets.leftCursorHoveringOnECSYInteractable,
        grabActionSet: sets.leftCursorHoldingECSYInteractable,
        grabStartActionPath: paths.actions.cursor.left.grab,
        grabEndActionPath: paths.actions.cursor.left.drop
      })
      .addComponent(RaycastInteractor)
      .addComponent(Raycaster, { value: leftCursorControllerEl.components["cursor-controller"].raycaster });

    const rightCursorControllerEl = document.getElementById("right-cursor-controller");

    this.rightCursorController = this.world
      .createEntity()
      .addComponent(AFrameEntity, { value: rightCursorControllerEl })
      .addComponent(CursorController, { id: "right" })
      .addComponent(Interactor, {
        hoverActionSet: sets.rightCursorHoveringOnECSYInteractable,
        grabActionSet: sets.rightCursorHoldingECSYInteractable,
        grabStartActionPath: paths.actions.cursor.right.grab,
        grabEndActionPath: paths.actions.cursor.right.drop
      })
      .addComponent(RaycastInteractor)
      .addComponent(Raycaster, { value: rightCursorControllerEl.components["cursor-controller"].raycaster });

    const leftControllerEl = document.getElementById("player-left-controller");

    this.leftHandController = this.world
      .createEntity()
      .addComponent(AFrameEntity, { value: leftControllerEl })
      .addComponent(HandController, { id: "left" })
      .addComponent(Interactor, {
        hoverActionSet: sets.leftHandHoveringOnECSYInteractable,
        grabActionSet: sets.leftHandHoldingECSYInteractable,
        grabStartActionPath: paths.actions.leftHand.grab,
        grabEndActionPath: paths.actions.leftHand.drop
      })
      .addComponent(PhysicsInteractor)
      .addComponent(PhysicsBody);

    const rightControllerEl = document.getElementById("player-right-controller");

    this.rightHandController = this.world
      .createEntity()
      .addComponent(AFrameEntity, { value: rightControllerEl })
      .addComponent(HandController, { id: "right" })
      .addComponent(Interactor, {
        hoverActionSet: sets.rightHandHoveringOnECSYInteractable,
        grabActionSet: sets.rightHandHoldingECSYInteractable,
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
