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
import { defineQuery, enterQuery, entityExists, exitQuery, hasComponent } from "bitecs";
import { HubsWorld } from "../app";
import {
  BehaviorGraph,
  CustomTags,
  Interacted,
  LocalAvatar,
  RemoteAvatar,
  Rigidbody,
  SceneLoader
} from "../bit-components";
import { anyEntityWith, findAncestorEntity } from "../utils/bit-utils";
import { ClientID, EntityID } from "../utils/networking-types";
import { AnimationNodes, animationValueDefs } from "./behavior-graph/animation-nodes";
import { entityEvents, EntityNodes, EntityValue as entityValueDefs } from "./behavior-graph/entity-nodes";
import { EulerNodes, eulerValueDefs } from "./behavior-graph/euler-nodes";
import { playerNodedefs, playerValueDefs } from "./behavior-graph/player-nodes";
import { cleanupNodespac, definitionListToMap } from "./behavior-graph/utils";
import { Vector3Nodes, Vector3Value as vec3ValueDefs } from "./behavior-graph/vec3-nodes";
import { NetworkingNodes } from "./behavior-graph/networking-nodes";
import { MediaNodes } from "./behavior-graph/media-nodes";
import { ElementNodes } from "./behavior-graph/elements-nodes";
import { PhysicsNodes } from "./behavior-graph/physics-nodes";
import { materialSystem } from "./behavior-graph/systems/material-system";
import { objectMaterialSystem } from "./behavior-graph/systems/object-material-system";
import { visibilitySystem } from "./behavior-graph/systems/visibility-system";
import { playersSystem } from "./behavior-graph/systems/player-system";
import { animationSystem } from "./behavior-graph/systems/animation-system";
import { mediaSystem } from "./behavior-graph/systems/media-system";
import { MaterialNodes } from "./behavior-graph/material-nodes";

const coreValues = getCoreValueTypes();
const logger = new DefaultLogger();
const registry: IRegistry = {
  nodes: {
    ...getCoreNodeDefinitions(coreValues),
    ...EntityNodes,
    ...Vector3Nodes,
    ...EulerNodes,
    ...AnimationNodes,
    ...NetworkingNodes,
    ...playerNodedefs,
    ...MediaNodes,
    ...ElementNodes,
    ...PhysicsNodes,
    ...MaterialNodes,
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

const easingNode = registry.nodes["math/easing"] as any;
easingNode.in.easingMode.choices = easingNode.in.easingMode.options.map((v: any) => ({ text: v, value: v }));
easingNode.in.easingFunction.choices = easingNode.in.easingFunction.options.map((v: any) => ({ text: v, value: v }));

const orders = ["XYZ", "YXZ", "ZXY", "ZYX", "YZX", "XZY"].map(v => ({ text: v, value: v }));
const eulerCombineNode = registry.nodes["math/euler/combine"] as any;
eulerCombineNode.in()[3].choices = orders;
eulerCombineNode.in()[3].defaultValue = orders[0].value;

const nodeSpec = cleanupNodespac(writeNodeSpecsToJSON({ ...registry, dependencies: {} }));
console.log("registry", registry, nodeSpec);
console.log(JSON.stringify(nodeSpec, null, 2));

type EngineState = {
  engine: Engine;
  lifecycleEmitter: ManualLifecycleEventEmitter;
};

const engines = new Map<EntityID, EngineState>();
const behaviorGraphsQuery = defineQuery([BehaviorGraph]);
const behaviorGraphEnterQuery = enterQuery(behaviorGraphsQuery);
const behaviorGraphExitQuery = exitQuery(behaviorGraphsQuery);
const interactedQuery = defineQuery([Interacted]);
const customTagsExitQuery = exitQuery(defineQuery([CustomTags]));

export function behaviorGraphSystem(world: HubsWorld) {
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

    // When referencing materials from nodes they are exported as another
    // material instance so when need to release them
    for (const [_, node] of Object.entries(engine.nodes)) {
      node.inputs.forEach(input => {
        if (input.valueTypeName === "material") {
          const matEid = input.value;
          const m = world.eid2mat.get(matEid);
          if (m) {
            world.eid2mat.delete(matEid);
            m.eid = 0;
          }
        } else if (input.valueTypeName === "texture") {
          const texEid = input.value;
          const t = world.eid2tex.get(texEid);
          if (t) {
            world.eid2tex.delete(texEid);
            t.eid = 0;
          }
        }
      });
    }

    engines.delete(eid);
    console.log("cleaned up engine", engine);
  });

  interactedQuery(world).forEach(function (eid) {
    entityEvents.get(eid)?.emitters.onInteract.emit(eid);
  });

  customTagsExitQuery(world).forEach(function (eid) {
    CustomTags.tags.delete(eid);
  });

  // TODO allocations
  const collisionCheckEntities = entityEvents.keys();
  // TODO lots of traversal and can probably be simplified a good deal
  for (const eid of collisionCheckEntities) {
    const triggerState = entityEvents.get(eid)!;

    const physicsSystem = AFRAME.scenes[0].systems["hubs-systems"].physicsSystem;
    if (!hasComponent(world, Rigidbody, eid)) {
      continue;
    }
    const triggerBody = Rigidbody.bodyId[eid];
    if (!physicsSystem.bodyUuidToData.has(triggerBody)) {
      continue;
    }

    for (let entity of triggerState.collidingEntities) {
      if (!entityExists(world, entity)) {
        triggerState.collidingEntities.delete(entity);
      }
    }

    triggerState.collidingEntities.forEach(function (collidingEid) {
      const collidingBody = Rigidbody.bodyId[collidingEid];
      const collisions = physicsSystem.getCollisions(collidingBody) as EntityID[];
      if (!collisions.length || !collisions.includes(triggerBody)) {
        triggerState.collidingEntities.delete(collidingEid);
        const playerEid = findAncestorEntity(world, collidingEid, isPlayerEntity);
        console.log("firingOnCollisionExit on", eid, "with", collidingEid);
        if (playerEid) {
          triggerState.emitters.onPlayerCollisionExit.emit(clientIdForEntity(world, playerEid));
        } else {
          triggerState.emitters.onCollisionExit.emit(collidingEid);
        }
      }
    });

    const collisionBodies = physicsSystem.getCollisions(Rigidbody.bodyId[eid]) as number[];
    if (collisionBodies.length) {
      for (let i = 0; i < collisionBodies.length; i++) {
        const collidingEid = physicsSystem.bodyUuidToData.get(collisionBodies[i]).object3D.eid as EntityID;
        const playerEid = findAncestorEntity(world, collidingEid, isPlayerEntity);
        if (triggerState.collidingEntities.has(collidingEid)) {
          if (playerEid) {
            triggerState.emitters.onPlayerCollisionStay.emit(clientIdForEntity(world, playerEid));
          } else {
            triggerState.emitters.onCollisionStay.emit(collidingEid);
          }
        } else {
          triggerState.collidingEntities.add(collidingEid);
          console.log("firingOnCollisionEnter on", eid, "with", collidingEid);
          if (playerEid) {
            triggerState.emitters.onPlayerCollisionEnter.emit(clientIdForEntity(world, playerEid));
          } else {
            triggerState.emitters.onCollisionEnter.emit(collidingEid);
          }
        }
      }
    }
  }

  behaviorGraphsQuery(world).forEach(function (eid) {
    // Wait for the scene to be completely loaded before start ticking
    const isSceneLoading = anyEntityWith(APP.world, SceneLoader);
    if (!isSceneLoading) {
      const { engine, lifecycleEmitter } = engines.get(eid)!;
      lifecycleEmitter.tickEvent.emit();
      engine.executeAllSync(0.1, 100);
    }
  });

  visibilitySystem(world);
  materialSystem(world);
  objectMaterialSystem(world);
  playersSystem(world);
  animationSystem(world);
  mediaSystem(world);
}
function isPlayerEntity(eid: EntityID, world: HubsWorld) {
  return hasComponent(world, RemoteAvatar, eid) || hasComponent(world, LocalAvatar, eid);
}

export function clientIdForEntity(world: HubsWorld, playerEid: number): ClientID {
  return world.eid2obj.get(playerEid)!.el!.components["player-info"].playerSessionId;
}
