/** @jsx createElementEntity */
import { AElement } from "aframe";
import { defineComponent, defineQuery, enterQuery, hasComponent, Types } from "bitecs";
import { AnimationAction, AnimationClip, AnimationMixer, Object3D, Quaternion, Vector3 } from "three";
import { Pathfinding, PathfindingHelper } from "three-pathfinding";

import { HubsWorld } from "../app";
import { Interacted, MediaLoaded, Owned } from "../bit-components";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import { defineNetworkSchema } from "../utils/define-network-schema";
import { NetworkSchema, schemas } from "../utils/network-schemas";
import { EntityID } from "../utils/networking-types";
import { takeOwnership } from "../utils/take-ownership";
import { createDefaultInflator, createElementEntity, EntityDef, jsxInflators } from "../utils/jsx-entity";
import { prefabs } from "../prefabs/prefabs";
import qsTruthy from "../utils/qs_truthy";

// Components
export const FollowPet = defineComponent({ state: Types.ui8 });
export const NetworkedFollowPet = defineComponent({ state: Types.ui8 });
declare module "../utils/jsx-entity" {
  interface JSXComponentData {
    followPet?: boolean;
    networkedFollowPet?: boolean;
  }
}
jsxInflators.followPet = createDefaultInflator(FollowPet);
jsxInflators.networkedFollowPet = createDefaultInflator(NetworkedFollowPet);

// Prefab
export function FollowPetPrefab(): EntityDef {
  /* const src = "https://github.com/la53rshark/tubby-cats/blob/main/1044/1044_animated.glb?raw=true"; */
  /* const src = "https://github.com/la53rshark/tubby-cats/blob/main/18595/18595_animated.glb?raw=true"; */
  /* const src = "https://github.com/webaverse/fox/blob/master/fox.glb?raw=true"; */
  /* const src = "https://github.com/la53rshark/tubby-cats/blob/main/159/159_animated.glb?raw=true"; */
  /* const src = "https://github.com/M3-org/tubby-pet/blob/main/floating.glb?raw=true"; */
  /* const src = "https://xp3d.io/wp-content/uploads/jin_tubby_idleFloat_idle_walk-1.glb"; */
  /* const src = "https://dev.reticulum.io/files/b928e345-b483-426c-bbb3-9eec7c65d651.glb?token=8d7c58b907922dbdf4afd602dee3c518"; */
  const src =
    "https://dev.reticulum.io/files/1be036c5-7419-44aa-bd6f-520bf5861cd1.glb?token=a1de3bd3c97b28c6a7f3e9c301d42c79";
  return (
    <entity
      name="Follow Pet"
      networked
      networkedTransform
      mediaLoader={{
        src,
        resize: false,
        recenter: false,
        animateLoad: true,
        isObjectMenuTarget: true
      }}
      deletable
      followPet
      networkedFollowPet
      cursorRaycastable
      remoteHoverTarget
      singleActionButton
    />
  );
}
// TODO figure out a way to do this without "kany". Probably fine if we jsut move the uggliness to a function
(prefabs as any).set("follow-pet", { template: FollowPetPrefab });

// Networking

export const NetworkedFollowPetSchema: NetworkSchema = {
  componentName: "networked-follow-pet",
  ...defineNetworkSchema(NetworkedFollowPet),
  serializeForStorage(_eid: EntityID) {
    return { version: 1, data: {} };
  },
  deserializeFromStorage: function () {}
};
schemas.set(NetworkedFollowPet, NetworkedFollowPetSchema);

// System

const FOLLOW_SPEED = 1;
const NAV_ZONE = "character";

interface PetSystemState {
  debugHelper: PathfindingHelper;
  walkAction: AnimationAction;
  idleAction: AnimationAction;
  floatAction: AnimationAction;
  waveAction: AnimationAction;
  head: EntityID;
  currentPath?: Vector3[];
}

const petData = new Map<number, PetSystemState>();

const loadedPetsQuery = defineQuery([FollowPet, MediaLoaded]);
const enteredLoadedPetsQuery = enterQuery(loadedPetsQuery);
const tmpPlayerPos = new Vector3();
const tmpPlayerHeadPos = new Vector3();
const tmpDir = new Vector3();
const tmpHeadRotation = new Quaternion();
const tmpHeadRotationTarget = new Quaternion();

enum PetState {
  IDLE,
  WALKING,
  WAVING
}

const petSettings = {
  flying: false,
  /* idle: "idle", */
  idle: "Idle",
  /* walk: "walk", */
  walk: "Walk",
  /* float: "idleFloat", */
  // float: "float",
  float: "IdleFloat",
  /* headBone: "mixamorigHead",
   * headBone: "Neck_1",
   * headBone: "mixamorig_Head", */
  wave: "Wave",
  headBone: "Head",
  lookOffset: new Quaternion()
  //   lookOffset: new Quaternion().setFromEuler(new Euler(30 * MathUtils.DEG2RAD, 0, 0))
};

const petsDebug = qsTruthy("petsDebug");

export function followPetSystem(
  world: HubsWorld,
  pathfinder: Pathfinding,
  characterController: CharacterControllerSystem
) {
  const playerRig = (document.getElementById("avatar-rig") as AElement)?.object3D.eid;
  const pov = (document.getElementById("avatar-pov-node") as AElement)?.object3D.eid;
  if (!(playerRig && pov)) return;

  world.eid2obj.get(playerRig)!.getWorldPosition(tmpPlayerPos);
  world.eid2obj.get(pov)!.getWorldPosition(tmpPlayerHeadPos);

  enteredLoadedPetsQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid)!;

    const debugHelper = new PathfindingHelper();
    (debugHelper as any)._markers.forEach((m: Object3D) => (m.matrixAutoUpdate = true));
    obj.parent!.add(debugHelper);

    const mixer = (obj.children[0] as any).mixer as AnimationMixer;
    const animations = (obj.children[0] as any).animations as AnimationClip[];

    const head = obj.getObjectByName(petSettings.headBone)!;
    // addComponent(world, NetworkedTransform, head.eid!);

    // HACK remove head animations from idle so they don't conflict with looking
    const idleClip = AnimationClip.findByName(animations, petSettings.idle);
    idleClip.tracks = idleClip.tracks.filter(track => !track.name.startsWith(head.uuid));
    const waveClip = AnimationClip.findByName(animations, petSettings.wave);
    waveClip.tracks = waveClip.tracks.filter(track => !track.name.startsWith(head.uuid));

    const idleAction = mixer
      .clipAction(AnimationClip.findByName(animations, petSettings.idle))
      .setLoop(THREE.LoopRepeat, Infinity);
    const walkAction = mixer
      .clipAction(AnimationClip.findByName(animations, petSettings.walk))
      .setLoop(THREE.LoopRepeat, Infinity);
    const floatAction = mixer
      .clipAction(AnimationClip.findByName(animations, petSettings.float))
      .setLoop(THREE.LoopRepeat, Infinity);
    const waveAction = mixer
      .clipAction(AnimationClip.findByName(animations, petSettings.wave))
      .setLoop(THREE.LoopRepeat, Infinity);

    FollowPet.state[eid] = PetState.IDLE;

    petData.set(eid, {
      debugHelper,
      idleAction,
      floatAction,
      walkAction,
      waveAction,
      head: head.eid!
    });
  });

  loadedPetsQuery(world).forEach(pet => {
    const prevState = FollowPet.state[pet];

    if (hasComponent(world, Interacted, pet)) {
      takeOwnership(world, pet);
      console.log("WAVING");
      NetworkedFollowPet.state[pet] = PetState.WAVING;
    }

    if (hasComponent(world, Owned, pet)) {
      updateOwnPet(world, pet, pathfinder, characterController, prevState);
    } else {
      petData.get(pet)!.debugHelper.visible = false;
    }

    FollowPet.state[pet] = NetworkedFollowPet.state[pet];

    if (FollowPet.state[pet] != prevState) {
      const { walkAction, idleAction, waveAction } = petData.get(pet)!;
      const stateToAction = [idleAction, walkAction, waveAction];
      console.log("from", stateToAction[prevState], "to", stateToAction[FollowPet.state[pet]]);
      stateToAction[FollowPet.state[pet]].reset().crossFadeFrom(stateToAction[prevState], 0.2, false).play();
    }

    // TODO there should be a system that handles just this
    const mixer = (world.eid2obj.get(pet)!.children[0] as any).mixer as AnimationMixer;
    mixer.update(world.time.delta / 1000);
  });
}

function updateOwnPet(
  world: HubsWorld,
  pet: EntityID,
  pathfinder: Pathfinding,
  characterController: CharacterControllerSystem,
  prevState: PetState
) {
  const data = petData.get(pet)!;
  const { debugHelper, waveAction } = data;

  if (NetworkedFollowPet.state[pet] === PetState.WAVING) {
    lookAtOwner(world, pet);
    if (prevState === PetState.WAVING && waveAction.time >= 2) {
      NetworkedFollowPet.state[pet] = PetState.IDLE;
    } else {
      return;
    }
  }

  // TODO debug helper shouldn't even be created if debugging is off
  debugHelper.visible = petsDebug && !petSettings.flying;

  const petObj = world.eid2obj.get(pet)!;
  const distanceSq = tmpPlayerPos.distanceToSquared(petObj.position);

  if (distanceSq > 1) {
    let target: Vector3;
    if (petSettings.flying) {
      target = tmpPlayerPos;
    } else {
      debugHelper.setPlayerPosition(petObj.position); // "player" here is the pet
      debugHelper.setTargetPosition(tmpPlayerPos);

      // TODO maybe don't need to pathfind every frame
      const newPath = pathfinder.findPath(petObj.position, tmpPlayerPos, NAV_ZONE, characterController.navGroup);
      if (newPath) {
        data.currentPath = newPath;
        debugHelper.setPath(newPath);
      }
      target = data.currentPath?.length ? data.currentPath[0] : tmpPlayerPos;
    }

    tmpDir.subVectors(target, petObj.position);
    const distanceSq = tmpDir.lengthSq();
    tmpDir.normalize();
    petObj.position.addScaledVector(tmpDir, FOLLOW_SPEED * (world.time.delta / 1000));
    petObj.lookAt(target.x, petObj.position.y, target.z);
    petObj.matrixNeedsUpdate = true;

    if (data.currentPath && distanceSq < 0.001) {
      data.currentPath.shift();
    }

    NetworkedFollowPet.state[pet] = PetState.WALKING;
  } else {
    lookAtOwner(world, pet);
    NetworkedFollowPet.state[pet] = PetState.IDLE;
  }
}

// TODO there are much cleaner ways to do this
function lookAtOwner(world: HubsWorld, pet: EntityID) {
  const { head } = petData.get(pet)!;
  const headObj = world.eid2obj.get(head)!;
  tmpHeadRotation.copy(headObj.quaternion);
  headObj.lookAt(tmpPlayerHeadPos);
  tmpHeadRotationTarget.copy(headObj.quaternion);
  tmpHeadRotationTarget.multiply(petSettings.lookOffset);
  headObj.quaternion.slerpQuaternions(tmpHeadRotation, tmpHeadRotationTarget, 0.1);
  headObj.matrixNeedsUpdate = true;
}
