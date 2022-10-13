import { defineQuery, enterQuery, exitQuery, removeComponent } from "bitecs";
import { HubsWorld } from "../app";
import { SceneLoader } from "../bit-components";
import { cancelable, coroutine } from "../utils/coroutine";
import { add, assignNetworkIds } from "./media-loading";
import { loadModel } from "../utils/load-model";

function* loadScene(world: HubsWorld, eid: number, signal: AbortSignal) {
  try {
    const src = APP.getString(SceneLoader.src[eid]);
    if (!src) throw new Error();
    const { value: scene, canceled } = yield* cancelable(loadModel(world, src), signal);
    if (!canceled) {
      // TODO: Maybe use scene id for root nid?
      assignNetworkIds(world, "scene", scene, eid);
      add(world, scene, eid);
      removeComponent(world, SceneLoader, eid);
      AFRAME.scenes[0].emit("environment-scene-loaded", scene);
      document.querySelector(".a-canvas")!.classList.remove("a-hidden");
    }
  } catch {
    console.error("Failed to load the scene");
  }
}

const jobs = new Set();
const abortControllers = new Map();
const sceneLoaderQuery = defineQuery([SceneLoader]);
const sceneLoaderEnterQuery = enterQuery(sceneLoaderQuery);
const sceneLoaderExitQuery = exitQuery(sceneLoaderQuery);
export function sceneLoadingSystem(world: HubsWorld) {
  sceneLoaderEnterQuery(world).forEach(function (eid) {
    const ac = new AbortController();
    abortControllers.set(eid, ac);
    jobs.add(coroutine(loadScene(world, eid, ac.signal)));
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
