import { addComponent, defineQuery, enterQuery, exitQuery } from "bitecs";
import { HubsWorld } from "../app";
import { FloatyObject, Held, HeldRemoteRight, Interacted, ObjectSpawner } from "../bit-components";
import { FLOATY_OBJECT_FLAGS } from "../systems/floaty-object-system";
import { coroutine } from "../utils/coroutine";
import { createNetworkedMedia } from "../utils/create-networked-entity";
import { EntityID } from "../utils/networking-types";
import { setMatrixWorld } from "../utils/three-utils";
import { animateScale } from "./media-loading";
import { sleep } from "../utils/async-utils";

export enum OBJECT_SPAWNER_FLAGS {
  /** Apply gravity to spawned objects */
  APPLY_GRAVITY = 1 << 0
}

function* spawnObjectJob(world: HubsWorld, spawner: EntityID) {
  if (!APP.hubChannel!.can("spawn_and_move_media")) return;

  const spawned = createNetworkedMedia(world, {
    src: APP.getString(ObjectSpawner.src[spawner])!,
    recenter: false,
    resize: false,
    animateLoad: false,
    isObjectMenuTarget: true,
    moveParentNotObject: true
  });

  if (ObjectSpawner.flags[spawner] & OBJECT_SPAWNER_FLAGS.APPLY_GRAVITY) {
    FloatyObject.flags[spawned] &= ~FLOATY_OBJECT_FLAGS.MODIFY_GRAVITY_ON_RELEASE;
  }

  addComponent(world, HeldRemoteRight, spawned);
  addComponent(world, Held, spawned);

  const spawnerObj = world.eid2obj.get(spawner)!;
  spawnerObj.updateMatrices();
  const spawnedObj = world.eid2obj.get(spawned)!;
  setMatrixWorld(spawnedObj, spawnerObj.matrixWorld);

  yield sleep(100);
  yield* animateScale(world, spawner);
}

// TODO type for coroutine
type Coroutine = () => IteratorResult<undefined, any>;
const jobs = new Map<EntityID, Coroutine>();

const interactedSpawnersEnterQuery = enterQuery(defineQuery([ObjectSpawner, Interacted]));
const spawnerExitQuery = exitQuery(defineQuery([ObjectSpawner]));
export function objectSpawnerSystem(world: HubsWorld) {
  interactedSpawnersEnterQuery(world).forEach(spawner => {
    if (!jobs.has(spawner)) jobs.set(spawner, coroutine(spawnObjectJob(world, spawner)));
  });
  spawnerExitQuery(world).forEach(function (spawner) {
    jobs.delete(spawner);
  });
  jobs.forEach((job, spawner) => {
    if (job().done) jobs.delete(spawner);
  });
}
