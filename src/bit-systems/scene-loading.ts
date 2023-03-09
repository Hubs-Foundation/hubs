import { AElement } from "aframe";
import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { Mesh } from "three";
import { HubsWorld } from "../app";
import { EnvironmentSettings, NavMesh, Networked, SceneLoader, SceneRoot, Skybox } from "../bit-components";
import Sky from "../components/skybox";
import { ScenePrefab } from "../prefabs/scene";
import { ExitReason } from "../react-components/room/ExitedRoomScreen";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import { EnvironmentSystem } from "../systems/environment-system";
import { setInitialNetworkedData, setNetworkedDataWithoutRoot } from "../utils/assign-network-ids";
import { anyEntityWith } from "../utils/bit-utils";
import { ClearFunction, JobRunner } from "../utils/coroutine-utils";
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
  environmentSystem: EnvironmentSystem,
  characterController: CharacterControllerSystem,
  clearRollbacks: ClearFunction
) {
  try {
    addComponent(world, Networked, loaderEid);
    // TODO: Use a unique id for each scene as the root nid
    setInitialNetworkedData(loaderEid, "scene", "reticulum");

    const src = APP.getString(SceneLoader.src[loaderEid]);
    if (!src) {
      throw new Error("Scene loading failed. No src url provided to load.");
    }

    const scene = yield* loadModel(world, src, "model/gltf", false);
    clearRollbacks(); // After this point, normal entity cleanup will takes care of things
    add(world, scene, loaderEid);
    setNetworkedDataWithoutRoot(world, APP.getString(Networked.id[loaderEid])!, scene);

    let skybox: Sky | undefined;
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
        // TODO the "as any" here is because of incorrect type definition for getObjectByProperty. It was fixed in r145
        const navMesh = o.getObjectByProperty("isMesh", true as any) as Mesh;
        // Some older scenes have the nav-mesh component as an ancestor of the mesh itself
        if (navMesh !== o) {
          console.warn("The `nav-mesh` component should be placed directly on a mesh.");
        }
        AFRAME.scenes[0].systems.nav.loadMesh(navMesh, "character");
      }

      if (!skybox && hasComponent(world, Skybox, o.eid!)) {
        skybox = o as Sky;
      }
    });

    const envSettings = { skybox };
    if (hasComponent(world, EnvironmentSettings, scene)) {
      Object.assign(envSettings, (EnvironmentSettings as any).map.get(scene));
    }
    environmentSystem.updateEnvironmentSettings(envSettings);

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

const jobs = new JobRunner();
const sceneLoaderQuery = defineQuery([SceneLoader]);
const sceneLoaderEnterQuery = enterQuery(sceneLoaderQuery);
const sceneLoaderExitQuery = exitQuery(sceneLoaderQuery);
export function sceneLoadingSystem(
  world: HubsWorld,
  environmentSystem: EnvironmentSystem,
  characterController: CharacterControllerSystem
) {
  sceneLoaderEnterQuery(world).forEach(function (eid) {
    jobs.add(eid, clearRollbacks => loadScene(world, eid, environmentSystem, characterController, clearRollbacks));
  });

  sceneLoaderExitQuery(world).forEach(function (eid) {
    jobs.stop(eid);
  });

  jobs.tick();
}
