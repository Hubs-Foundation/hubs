import { AElement } from "aframe";
import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, removeComponent, removeEntity } from "bitecs";
import { Mesh } from "three";
import { HubsWorld } from "../app";
import {
  EnvironmentSettings,
  HeightFieldTag,
  NavMesh,
  Networked,
  SceneLoader,
  ScenePreviewCamera,
  SceneRoot,
  Skybox,
  TrimeshTag
} from "../bit-components";
import Sky from "../components/skybox";
import { Fit, inflatePhysicsShape, Shape } from "../inflators/physics-shape";
import { ScenePrefab } from "../prefabs/scene";
import { ExitReason } from "../react-components/room/ExitedRoomScreen";
import { CharacterControllerSystem } from "../systems/character-controller-system";
import { EnvironmentSystem } from "../systems/environment-system";
import { setInitialNetworkedData, setNetworkedDataWithoutRoot } from "../utils/assign-network-ids";
import { anyEntityWith, findChildWithComponent } from "../utils/bit-utils";
import { ClearFunction, JobRunner } from "../utils/coroutine-utils";
import { renderAsEntity } from "../utils/jsx-entity";
import { loadModel } from "../utils/load-model";
import { EntityID } from "../utils/networking-types";
import { isGeometryHighDensity } from "../utils/physics-utils";
import { add } from "./media-loading";
import { moveToSpawnPoint } from "./waypoint";
import { SourceType } from "../components/audio-params";

export function swapActiveScene(world: HubsWorld, src: string) {
  const currentScene = anyEntityWith(APP.world, SceneRoot);
  if (currentScene) {
    removeEntity(APP.world, currentScene);
  }

  const newScene = renderAsEntity(world, ScenePrefab(src));
  (document.querySelector("#environment-scene") as AElement).object3D.add(world.eid2obj.get(newScene)!);
}

const navMeshesQuery = defineQuery([NavMesh]);

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

    APP.sceneAudioDefaults.delete(SourceType.AVATAR_AUDIO_SOURCE);
    APP.sceneAudioDefaults.delete(SourceType.MEDIA_VIDEO);

    const scene = yield* loadModel(world, src, "model/gltf", false);
    clearRollbacks(); // After this point, normal entity cleanup will takes care of things
    add(world, scene, loaderEid);
    setNetworkedDataWithoutRoot(world, APP.getString(Networked.id[loaderEid])!, scene);

    let hasMesh = false;
    let sceneEl = APP.scene!;
    let isHighDensity = false;
    let skybox: Sky | undefined;
    world.eid2obj.get(scene)!.traverse(o => {
      if ((o as Mesh).isMesh) {
        // TODO animated objects should not be static
        (o as Mesh).reflectionProbeMode = "static";
        hasMesh ||= true;
      }
      if ((o as any).isReflectionProbe) {
        o.updateMatrices();
        // TODO: In three.js, update reflection probes so that boxes are defined in local space.
        (o as any).box.applyMatrix4(o.matrixWorld);
      }

      if (!skybox && hasComponent(world, Skybox, o.eid!)) {
        skybox = o as Sky;
      }

      if (
        (o as Mesh).isMesh &&
        !(o instanceof Sky) &&
        !o.name.startsWith("Floor_Plan") &&
        !o.name.startsWith("Ground_Plane") &&
        ((o as Mesh).geometry as any).boundsTree
      ) {
        if (isGeometryHighDensity((o as Mesh).geometry)) {
          isHighDensity = true;
        }
      }
    });

    // Find and load a nav-mesh
    let navMesh;
    let navMeshEid;
    const navMeshes = navMeshesQuery(APP.world);
    if (navMeshes.length > 0) {
      navMeshEid = navMeshes[0];
    }
    if (navMeshEid) {
      const navMeshObj = world.eid2obj.get(navMeshEid);
      // TODO the "as any" here is because of incorrect type definition for getObjectByProperty. It was fixed in r145
      navMesh = navMeshObj?.getObjectByProperty("isMesh", true as any) as Mesh;
      // Some older scenes have the nav-mesh component as an ancestor of the mesh itself
      if (navMesh !== navMeshObj) {
        console.warn("The `nav-mesh` component should be placed directly on a mesh.");
      }
      if (navMesh) {
        navMesh.visible = false;
        sceneEl.systems.nav.loadMesh(navMesh, "character");
      }
    }

    // Create scene physics
    if (findChildWithComponent(world, TrimeshTag, scene) || findChildWithComponent(world, HeightFieldTag, scene)) {
      console.log("heightfield or trimesh found on scene");
    } else {
      if (isHighDensity && navMesh) {
        inflatePhysicsShape(world, navMesh.eid!, {
          type: Shape.MESH,
          margin: 0.01,
          fit: Fit.ALL,
          includeInvisible: true
        });
      } else if (!isHighDensity && hasMesh) {
        inflatePhysicsShape(world, scene, {
          type: Shape.MESH,
          margin: 0.01,
          fit: Fit.ALL
        });
        console.log("Adding mesh shape for all visible meshes");
      } else {
        inflatePhysicsShape(world, scene, {
          type: Shape.BOX,
          margin: 0.01,
          fit: Fit.MANUAL,
          halfExtents: [4000, 0.5, 4000],
          offset: [0, -0.5, 0]
        });
        console.log("Adding default floor collision");
      }
    }

    const envSettings = { skybox };
    if (hasComponent(world, EnvironmentSettings, scene)) {
      Object.assign(envSettings, (EnvironmentSettings as any).map.get(scene));
    }
    environmentSystem.updateEnvironmentSettings(envSettings);

    const cameraNode = (document.getElementById("scene-preview-node") as AElement).object3D!;
    removeComponent(world, ScenePreviewCamera, cameraNode.eid!);
    const sceneObj = world.eid2obj.get(scene)!;
    const previewCamera = sceneObj.getObjectByName("scene-preview-camera");
    if (previewCamera) {
      cameraNode.position.copy(previewCamera.position);
      cameraNode.rotation.copy(previewCamera.rotation);
      cameraNode.rotation.reorder("YXZ");
    } else {
      const cameraPos = cameraNode.position;
      cameraNode.position.set(cameraPos.x, 2.5, cameraPos.z);
    }
    cameraNode.matrixNeedsUpdate = true;
    addComponent(world, ScenePreviewCamera, cameraNode.eid!);
    ScenePreviewCamera.duration[cameraNode.eid!] = 60;
    ScenePreviewCamera.positionOnly[cameraNode.eid!] = 1;

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
