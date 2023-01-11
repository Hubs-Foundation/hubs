import { AElement } from "aframe";
import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { Mesh } from "three";
import { HubsWorld } from "../app";
import { EnvironmentSettings, NavMesh, Networked, SceneLoader, SceneRoot } from "../bit-components";
import { ScenePrefab } from "../prefabs/scene";
import { ExitReason } from "../react-components/room/ExitedRoomScreen";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import { EnvironmentSystem } from "../systems/environment-system";
import { setInitialNetworkedData, setNetworkedDataWithoutRoot } from "../utils/assign-network-ids";
import { anyEntityWith } from "../utils/bit-utils";
import { cancelable, coroutine } from "../utils/coroutine";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadModel } from "../utils/load-model";
import { EntityID } from "../utils/networking-types";
import { add } from "./media-loading";
import { moveToSpawnPoint } from "./waypoint";

export function swapActiveScene(world: HubsWorld, src: string) {
  const currentScene = anyEntityWith(APP.world, SceneRoot);
  if (currentScene) {
    removeEntity(APP.world, currentScene);
  }

  const newScene = renderAsEntity(world, ScenePrefab(src));
  (document.querySelector("#environment-scene") as AElement).object3D.add(world.eid2obj.get(newScene)!);
}

function* loadScene(
  world: HubsWorld,
  loaderEid: EntityID,
  signal: AbortSignal,
  environmentSystem: EnvironmentSystem,
  characterController: CharacterControllerSystem
) {
  try {
    addComponent(world, Networked, loaderEid);
    // TODO: Use a unique id for each scene as the root nid
    setInitialNetworkedData(world, loaderEid, "scene", "reticulum");

    const src = APP.getString(SceneLoader.src[loaderEid]);
    if (!src) {
      throw new Error("Scene loading failed. No src url provided to load.");
    }

    const { value: scene, canceled } = yield* cancelable(loadModel(world, src, false), signal);
    if (canceled) {
      return;
    }

    add(world, scene, loaderEid);
    setNetworkedDataWithoutRoot(world, APP.getString(Networked.id[loaderEid])!, scene);

    if (hasComponent(world, EnvironmentSettings, scene)) {
      // TODO: Support legacy components (fog, background, skybox)
      const environmentSettings = (EnvironmentSettings as any).map.get(scene);
      environmentSystem.updateEnvironmentSettings(environmentSettings);
    } else {
      environmentSystem.updateEnvironmentSettings({});
    }
    world.eid2obj.get(scene)!.traverse(o => {
      if ((o as Mesh).isMesh) {
        // TODO animated objects should not be static
        (o as Mesh).reflectionProbeMode = "static";
      }
      if ((o as any).isReflectionProbe) {
        o.updateMatrices();
        // TODO: In three.js, update reflection probes so that boxes are defined in local space.
        (o as any).box.applyMatrix4(o.matrixWorld);
      }
      if (hasComponent(world, NavMesh, o.eid!)) {
        AFRAME.scenes[0].systems.nav.loadMesh(o as Mesh, "character");
      }
    });
    const sceneEl = AFRAME.scenes[0];
    sceneEl.emit("environment-scene-loaded", scene);
    document.querySelector(".a-canvas")!.classList.remove("a-hidden");
    sceneEl.addState("visible");
    if (sceneEl.is("entered")) {
      moveToSpawnPoint(world, characterController);
    }
    const fader = (document.getElementById("viewing-camera")! as AElement).components["fader"];
    (fader as any).fadeIn();
    removeComponent(world, SceneLoader, loaderEid);
  } catch (e) {
    console.error(e);
    console.error("Failed to load the scene");
    APP.messageDispatch?.remountUI({ roomUnavailableReason: ExitReason.sceneError });
    APP.entryManager!.exitScene();
  }
}

const jobs = new Set();
const abortControllers = new Map();
const sceneLoaderQuery = defineQuery([SceneLoader]);
const sceneLoaderEnterQuery = enterQuery(sceneLoaderQuery);
const sceneLoaderExitQuery = exitQuery(sceneLoaderQuery);
export function sceneLoadingSystem(
  world: HubsWorld,
  environmentSystem: EnvironmentSystem,
  characterController: CharacterControllerSystem
) {
  sceneLoaderEnterQuery(world).forEach(function (eid) {
    const ac = new AbortController();
    abortControllers.set(eid, ac);
    jobs.add(coroutine(loadScene(world, eid, ac.signal, environmentSystem, characterController)));
  });

  sceneLoaderExitQuery(world).forEach(function (eid) {
    const ac = abortControllers.get(eid);
    ac.abort();
    abortControllers.delete(eid);
  });

  jobs.forEach((c: Coroutine) => {
    if (c().done) {
      jobs.delete(c);
    }
  });
}

// TODO: Don't use any. Write the correct type
type Coroutine = () => any;
