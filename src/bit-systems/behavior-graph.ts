import {
  DefaultLogger,
  Engine,
  getCoreNodeDefinitions,
  getCoreValueTypes,
  GraphJSON,
  IRegistry,
  Logger,
  makeCoreDependencies,
  makeFlowNodeDefinition,
  ManualLifecycleEventEmitter,
  readGraphFromJSON,
  validateGraph,
  validateRegistry,
  writeNodeSpecsToJSON
} from "@oveddan-behave-graph/core";
import { defineQuery, enterQuery, exitQuery, hasComponent } from "bitecs";
import { AnimationMixer } from "three";
import { HubsWorld } from "../app";
import { BehaviorGraph, Interacted, LocalAvatar, MixerAnimatable, RemoteAvatar, Rigidbody } from "../bit-components";
import { findAncestorEntity } from "../utils/bit-utils";
import { ClientID, EntityID } from "../utils/networking-types";
import { AnimationNodes, animationValueDefs } from "./behavior-graph/animation-nodes";
import { entityEvents, EntityNodes, EntityValue as entityValueDefs } from "./behavior-graph/entity-nodes";
import { EulerNodes, eulerValueDefs } from "./behavior-graph/euler-nodes";
import { playerNodedefs, playerValueDefs } from "./behavior-graph/player-nodes";
import { cleanupNodespac, definitionListToMap } from "./behavior-graph/utils";
import { Vector3Nodes, Vector3Value as vec3ValueDefs } from "./behavior-graph/vec3-nodes";

const coreValues = getCoreValueTypes();
const logger = new DefaultLogger();
const registry: IRegistry = {
  nodes: {
    ...getCoreNodeDefinitions(coreValues),
    ...EntityNodes,
    ...Vector3Nodes,
    ...EulerNodes,
    ...AnimationNodes,
    ...playerNodedefs,
    ...definitionListToMap([
      makeFlowNodeDefinition({
        typeName: "hubs/displayMessage",
        category: "Misc" as any,
        label: "Display Notification Message",
        in: { flow: "flow", text: "string" },
        out: { flow: "flow" },
        initialState: undefined,
        triggered: ({ read, commit }) => {
          APP.messageDispatch.receive({ type: "script_message", msg: read<string>("text") });
          commit("flow");
        }
      })
    ])
  },
  values: {
    ...coreValues,
    ...vec3ValueDefs,
    ...entityValueDefs,
    ...eulerValueDefs,
    ...animationValueDefs,
    ...playerValueDefs
  }
};

const nodeSpec = cleanupNodespac(writeNodeSpecsToJSON({ ...registry, dependencies: {} }));
console.log("registry", registry, nodeSpec);
console.log(JSON.stringify(nodeSpec, null, 2));

const mixerAnimatableQuery = defineQuery([MixerAnimatable]);
const mixerAnimatableEnteryQuery = enterQuery(mixerAnimatableQuery);
const mixerAnimatableExitQuery = exitQuery(mixerAnimatableQuery);
function stubAnimationMixerSystem(world: HubsWorld) {
  mixerAnimatableEnteryQuery(world).forEach(eid => {
    const obj = world.eid2obj.get(eid)!;
    const mixer = new AnimationMixer(obj);
    MixerAnimatable.mixers.set(eid, mixer);

    // TODO remove, only for debug
    (obj as any).mixer = mixer;
  });

  mixerAnimatableExitQuery(world).forEach(eid => {
    const mixer = MixerAnimatable.mixers.get(eid)!;
    mixer.stopAllAction();
    MixerAnimatable.mixers.delete(eid);
  });

  mixerAnimatableQuery(world).forEach(eid => {
    MixerAnimatable.mixers.get(eid)!.update(world.time.delta / 1000);
  });
}

type EngineState = {
  engine: Engine;
  lifecycleEmitter: ManualLifecycleEventEmitter;
};

const collidingEntities: EntityID[] = [];
const engines = new Map<EntityID, EngineState>();
const behaviorGraphsQuery = defineQuery([BehaviorGraph]);
const behaviorGraphEnterQuery = enterQuery(behaviorGraphsQuery);
const behaviorGraphExitQuery = exitQuery(behaviorGraphsQuery);
const interactedQuery = defineQuery([Interacted]);

export function behaviorGraphSystem(world: HubsWorld) {
  stubAnimationMixerSystem(world);

  behaviorGraphEnterQuery(world).forEach(function (eid) {
    const obj = world.eid2obj.get(eid)!;
    const graphJson = obj.userData.behaviorGraph as GraphJSON;

    const lifecycleEmitter = new ManualLifecycleEventEmitter();
    const dependencies = {
      world,
      rootEntity: eid,
      ...makeCoreDependencies({
        lifecyleEmitter: lifecycleEmitter,
        logger
      })
    };

    const graph = readGraphFromJSON({
      graphJson,
      nodes: registry.nodes,
      values: registry.values,
      dependencies
    });
    graph.name = `Test ${eid}`;

    console.log("Loaded graph", graph);
    const registryErrors = validateRegistry(registry);
    registryErrors.forEach(e => {
      console.error("Graph Registry Error", e);
    });
    const graphErrors = validateGraph(graph);
    graphErrors.forEach(e => {
      console.error("Graph Validation Error", e);
    });

    const engine = new Engine(graph.nodes);
    engines.set(eid, { engine, lifecycleEmitter });

    Logger.verbose("initialize graph");
    engine.executeAllSync();

    if (lifecycleEmitter.startEvent.listenerCount > 0) {
      lifecycleEmitter.startEvent.emit();
    }
  });

  behaviorGraphExitQuery(world).forEach(function (eid) {
    const { engine, lifecycleEmitter } = engines.get(eid)!;
    engine.dispose();
    // TODO probably a noop
    lifecycleEmitter.startEvent.clear();
    lifecycleEmitter.tickEvent.clear();
    lifecycleEmitter.endEvent.clear();
    engines.delete(eid);
    console.log("cleaned up engine", engine);
  });

  interactedQuery(world).forEach(function (eid) {
    console.log("interact", eid, entityEvents.onInteract.get(eid));
    entityEvents.onInteract.get(eid)?.emit(eid);
  });

  // TODO allocations
  const collisionCheckEntiteis = new Set([
    ...entityEvents.onCollisionEnter.keys(),
    ...entityEvents.onCollisionExit.keys(),
    ...entityEvents.onPlayerCollisionEnter.keys(),
    ...entityEvents.onPlayerCollisionExit.keys()
  ]);

  // TODO lots of traversal and can probably be simplified a good deal
  for (const eid of collisionCheckEntiteis) {
    const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
    if (!hasComponent(world, Rigidbody, eid)) {
      console.warn("no rigidbody");
      return;
    }
    const triggerBody = Rigidbody.bodyId[eid];
    if (!physicsSystem.bodyUuidToData.has(triggerBody)) {
      console.warn("no body data");
      return;
    }

    collidingEntities.forEach(function (collidingEid) {
      const collidingBody = Rigidbody.bodyId[collidingEid];
      const collisions = physicsSystem.getCollisions(collidingBody) as EntityID[];
      if (!collisions.length || !collisions.includes(triggerBody)) {
        collidingEntities.splice(collidingEntities.indexOf(collidingEid));
        const playerEid = findAncestorEntity(world, collidingEid, isPlayerEntity);
        if (playerEid) {
          const emitter = entityEvents.onPlayerCollisionExit.get(eid);
          emitter && emitter.emit(clientIdForEntity(world, playerEid));
        } else {
          const emitter = entityEvents.onCollisionExit.get(eid);
          emitter && emitter.emit(collidingEid);
        }
      }
    });

    const collisions = physicsSystem.getCollisions(Rigidbody.bodyId[eid]) as EntityID[];
    if (collisions.length) {
      for (let i = 0; i < collisions.length; i++) {
        const bodyData = physicsSystem.bodyUuidToData.get(collisions[i]);
        const collidingEid = bodyData.object3D.eid;
        if (!collidingEntities.includes(collidingEid)) {
          collidingEntities.push(collidingEid);
          const playerEid = findAncestorEntity(world, collidingEid, isPlayerEntity);
          if (playerEid) {
            const emitter = entityEvents.onPlayerCollisionEnter.get(eid);
            emitter && emitter.emit(clientIdForEntity(world, playerEid));
          } else {
            const emitter = entityEvents.onCollisionEnter.get(eid);
            emitter && emitter.emit(collidingEid);
          }
        }
      }
    }
  }

  behaviorGraphsQuery(world).forEach(function (eid) {
    const { engine, lifecycleEmitter } = engines.get(eid)!;
    lifecycleEmitter.tickEvent.emit();
    engine.executeAllSync(0.1, 100);
  });
}
function isPlayerEntity(eid: EntityID, world: HubsWorld) {
  return hasComponent(world, RemoteAvatar, eid) || hasComponent(world, LocalAvatar, eid);
}

function clientIdForEntity(world: HubsWorld, playerEid: number): ClientID {
  return world.eid2obj.get(playerEid)!.el!.components["player-info"].playerSessionId;
}
