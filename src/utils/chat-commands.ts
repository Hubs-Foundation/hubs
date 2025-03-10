import { AScene } from "aframe";
import { Object3D } from "three";
import { HubsWorld } from "../app";
import { moveToSpawnPoint } from "../bit-systems/waypoint";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import { createNetworkedMedia } from "./create-networked-entity";
import { shouldUseNewLoader } from "./bit-utils";

function checkFlag(args: string[], flag: string) {
  return !!args.find(s => s === flag);
}

function usage(
  commandName: string,
  flags: string[] | null,
  options: Map<string, string[]> | null,
  rest: string[] | null
) {
  let str = [];
  str.push(`/${commandName}`);
  if (flags) {
    flags.forEach(flag => {
      str.push(`[${flag}]`);
    });
  }
  if (options) {
    options.forEach((values, key) => {
      str.push(`[${key}=(${values.join(" | ")})]`);
    });
  }
  if (rest) {
    rest.forEach(s => str.push(`<${s}>`));
  }
  return str.join(" ");
}

const FLAG_RESIZE = "--resize";
const FLAG_RECENTER = "--recenter";
const FLAG_ANIMATE_LOAD = "--animate";
const FLAG_NO_OBJECT_MENU = "--no-menu";
const ADD_FLAGS = [FLAG_RESIZE, FLAG_RECENTER, FLAG_ANIMATE_LOAD, FLAG_NO_OBJECT_MENU];
export function add(world: HubsWorld, avatarPov: Object3D, args: string[]) {
  if (!APP.hubChannel!.can("spawn_and_move_media")) return;
  args = args.filter(arg => arg);
  if (args.length) {
    const initialData = {
      src: args[args.length - 1],
      resize: checkFlag(args, FLAG_RESIZE),
      recenter: checkFlag(args, FLAG_RECENTER),
      animateLoad: checkFlag(args, FLAG_ANIMATE_LOAD),
      isObjectMenuTarget: !checkFlag(args, FLAG_NO_OBJECT_MENU)
    };
    console.log("Adding media", initialData);
    const eid = createNetworkedMedia(world, initialData);
    const obj = APP.world.eid2obj.get(eid)!;
    obj.position.copy(avatarPov.localToWorld(new THREE.Vector3(0, 0, -1.5)));
    obj.lookAt(avatarPov.getWorldPosition(new THREE.Vector3()));
  } else {
    console.log(usage("add", ADD_FLAGS, null, ["url"]));
  }
}

function changeScene(sceneUrl: string) {
  console.log(`Changing scene to ${sceneUrl}`);
  const error = APP.hubChannel!.updateScene(sceneUrl);
  if (error) {
    console.error(error);
  }
}

function changeAvatar(avatarUrl: string) {
  console.log(`Changing avatar to ${avatarUrl}`);
  APP.store.update({ profile: { ...APP.store.state.profile, ...{ avatarId: avatarUrl } } });
  AFRAME.scenes[0].emit("avatar_updated");
}

const TEST_ASSET_PREFIX =
  "https://raw.githubusercontent.com/Hubs-Foundation/hubs-sample-assets/main/Hubs%20Components/Exported%20GLB%20Models/";
const TEST_ASSET_SUFFIX = ".glb";
const FLAG_SCENE = "--scene";
const FLAG_AVATAR = "--avatar";
const TEST_ASSET_FLAGS = [FLAG_SCENE, FLAG_AVATAR, ...ADD_FLAGS];
export function testAsset(world: HubsWorld, avatarPov: Object3D, args: string[]) {
  args = args.filter(arg => arg);
  if (!args.length) {
    console.log(usage("test", TEST_ASSET_FLAGS, null, ["AssetName"]));
    return;
  }

  args[args.length - 1] = [TEST_ASSET_PREFIX, args[args.length - 1], TEST_ASSET_SUFFIX].join("");
  if (checkFlag(args, FLAG_SCENE)) {
    changeScene(args[args.length - 1]);
  } else if (checkFlag(args, FLAG_AVATAR)) {
    changeAvatar(args[args.length - 1]);
  } else {
    add(world, avatarPov, args);
  }
}

export function respawn(world: HubsWorld, scene: AScene, characterController: CharacterControllerSystem) {
  if (!scene.is("entered")) {
    console.error("Cannot respawn until you have entered the room.");
    return;
  }

  if (!shouldUseNewLoader()) {
    console.error("This command only works with the newLoader query string parameter.");
    return;
  }

  moveToSpawnPoint(world, characterController);
}
