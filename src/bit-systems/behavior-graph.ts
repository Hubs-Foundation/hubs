import {
  DefaultLogger,
  Engine,
  EventEmitter,
  getCoreNodeDefinitions,
  getCoreValueTypes,
  GraphJSON,
  IRegistry,
  Logger,
  makeCoreDependencies,
  makeEventNodeDefinition,
  makeFlowNodeDefinition,
  makeInNOutFunctionDesc,
  ManualLifecycleEventEmitter,
  NodeCategory,
  readGraphFromJSON,
  validateGraph,
  validateRegistry,
  ValueType,
  writeNodeSpecsToJSON
} from "@oveddan-behave-graph/core";
import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, IComponent } from "bitecs";
import { BoxGeometry, Euler, Mesh, MeshStandardMaterial, Object3D, Quaternion, Vector3 } from "three";
import { HubsWorld } from "../app";
import * as bitComponents from "../bit-components";
import {
  BehaviorGraph,
  CursorRaycastable,
  Interacted,
  RemoteHoverTarget,
  Rigidbody,
  SingleActionButton
} from "../bit-components";
import { COLLISION_LAYERS } from "../constants";
import { Fit, inflatePhysicsShape, Shape } from "../inflators/physics-shape";
import { inflateRigidBody, Type } from "../inflators/rigid-body";
import { findAncestorWithComponent } from "../utils/bit-utils";
import { EntityID } from "../utils/networking-types";
import { Vector3Nodes, Vector3Value } from "./behavior-graph/vec3-nodes";

const coreValues = getCoreValueTypes();
const coreNodes = getCoreNodeDefinitions(coreValues);
const logger = new DefaultLogger();

type EntityEventCallback = (eid: EntityID) => void;

const entityEvents = {
  onInteract: new Map<EntityID, EventEmitter<EntityID>>(),
  onCollisionEnter: new Map<EntityID, EventEmitter<EntityID>>(),
  onCollisionExit: new Map<EntityID, EventEmitter<EntityID>>()
};
type EntityEventState = {
  target?: EntityID;
  callback?: (target: EntityID) => void;
};
function makeEntityEventNode(event: keyof typeof entityEvents, hackySetup?: (target: EntityID) => void) {
  return makeEventNodeDefinition({
    typeName: `hubs/${event}`,
    category: NodeCategory.Event,
    in: {},
    out: {
      flow: "flow",
      entity: "entity"
    },
    configuration: {
      target: { valueType: "entity" }
    },
    initialState: {} as EntityEventState,
    init: ({ write, commit, configuration }) => {
      const target = configuration["target"] as EntityID;
      if (!target) throw new Error(`hubs/${event} must have a target`);
      hackySetup && hackySetup(target);
      const callback: EntityEventCallback = eid => {
        console.log(event, eid, APP.world.eid2obj.get(eid));
        write("entity", eid);
        commit("flow");
      };
      const emitter = entityEvents[event].get(target) || new EventEmitter();
      emitter.addListener(callback);
      entityEvents[event].set(target, emitter);
      return { target, callback };
    },
    dispose: ({ state: { callback, target } }) => {
      const emitter = entityEvents[event].get(target!)!;
      emitter.removeListener(callback!);
      if (!emitter.listenerCount) entityEvents[event].delete(target!);
      return {};
    }
  });
}

function makeObjectPropertyFlowNode<T extends keyof Object3D>(property: T, valueType: string) {
  const typeName = `hubs/entity/set/${property}`;
  return {
    [typeName]: makeFlowNodeDefinition({
      typeName,
      category: "Entity" as any,
      label: `Set ${property}`,
      in: () => [
        { key: "flow", valueType: "flow" },
        { key: "entity", valueType: "entity" },
        { key: property, valueType }
      ],
      initialState: undefined,
      out: { flow: "flow" },
      triggered: ({ read, commit }) => {
        const eid = read("entity") as EntityID;
        const obj = APP.world.eid2obj.get(eid);
        if (!obj) {
          console.error(`${typeName} could not find entity`, eid);
          return;
        }
        const value = read(property) as Object3D[T];
        const prop = obj[property];
        if (typeof prop === "object" && "copy" in prop) {
          prop.copy(value);
          if (["position", "rotation", "scale"].includes(property)) obj.matrixNeedsUpdate = true;
        } else {
          obj[property] = value;
        }
        commit("flow");
      }
    })
  };
}

export const EntityValue = new ValueType(
  "entity",
  () => 0,
  (value: EntityID) => value,
  (value: EntityID) => value,
  (start: EntityID, end: EntityID, t: number) => (t < 0.5 ? start : end)
);

type EulerJSON = { x: number; y: number; z: number };
const tmpQuat1 = new Quaternion();
const tmpQuat2 = new Quaternion();
export const EurlerValue = new ValueType(
  "euler",
  () => new Euler(),
  (value: Euler | EulerJSON) => (value instanceof Euler ? value : new Euler(value.x, value.y, value.z)),
  (value: Euler) => ({ x: value.x, y: value.y, z: value.z }),
  (start: Euler, end: Euler, t: number) =>
    start.setFromQuaternion(tmpQuat1.setFromEuler(start).slerp(tmpQuat2.setFromEuler(end), t))
);

const registry = {
  nodes: {
    ...coreNodes,
    "hubs/onInteract": makeEntityEventNode("onInteract", function (target) {
      // TODO should be added in blender
      addComponent(APP.world, SingleActionButton, target);
      addComponent(APP.world, CursorRaycastable, target);
      addComponent(APP.world, RemoteHoverTarget, target);
    }),
    "hubs/onCollisionEnter": makeEntityEventNode("onCollisionEnter", function (target) {
      // TODO should be added in blender
      inflateRigidBody(APP.world, target, {
        // emitCollisionEvents: true,
        type: Type.STATIC,
        collisionGroup: COLLISION_LAYERS.TRIGGERS,
        collisionMask: COLLISION_LAYERS.INTERACTABLES | COLLISION_LAYERS.AVATAR,
        disableCollision: true
      });
      inflatePhysicsShape(APP.world, target, {
        type: Shape.BOX,
        fit: Fit.MANUAL,
        halfExtents: [0.5, 0.5, 0.5]
      });
      const obj = APP.world.eid2obj.get(target)!;
      obj.add(new Mesh(new BoxGeometry(), new MeshStandardMaterial()));
    }),
    "hubs/onCollisionExit": makeEntityEventNode("onCollisionExit"),
    "hubs/entity/toString": makeInNOutFunctionDesc({
      name: "hubs/entity/toString",
      label: "Entity toString",
      category: "Entity" as any,
      in: [{ entity: "entity" }],
      out: "string",
      exec: (entity: EntityID) => {
        const obj = APP.world.eid2obj.get(entity)!;
        return `Entity ${obj.name}`;
      }
    }),
    "hubs/entity/hasComponent": makeInNOutFunctionDesc({
      name: "hubs/entity/hasComponent",
      label: "Entity Has Component",
      category: "Entity" as any,
      in: [{ entity: "entity" }, { name: "string" }, { includeAncestors: "boolean" }],
      out: "boolean",
      exec: (entity: EntityID, name: string, includeAncestors: boolean) => {
        const Component = (bitComponents as any)[name] as IComponent | undefined;
        if (!Component) {
          console.error(`Invalid component name ${name} in hubs/entity/hasComponent node`);
          return false;
        }
        if (includeAncestors) {
          return !!findAncestorWithComponent(APP.world, Component, entity);
        } else {
          return hasComponent(APP.world, Component, entity);
        }
      }
    }),
    "hubs/entity/properties": makeInNOutFunctionDesc({
      name: "hubs/entity/properties",
      label: "Get Entity Properties",
      category: "Entity" as any,
      in: [{ entity: "entity" }],
      out: [
        { entity: "entity" },
        { name: "string" },
        { visible: "boolean" },
        { position: "vec3" },
        { rotation: "euler" },
        { scale: "vec3" }
      ],
      exec: (eid: EntityID) => {
        const obj = APP.world.eid2obj.get(eid)!;
        return {
          entity: eid,
          name: obj.name,
          visible: obj.visible,
          position: obj.position,
          rotation: obj.rotation,
          scale: obj.scale
        };
      }
    }),

    "math/euler/combine": makeInNOutFunctionDesc({
      name: "math/euler/combine",
      label: "Combine Euler",
      category: "Eueler Math" as any,
      in: [{ x: "float" }, { y: "float" }, { z: "float" }],
      out: [{ v: "euler" }],
      exec: (x: number, y: number, z: number) => {
        return { v: new Euler(x, y, z) };
      }
    }),
    "math/euler/separate": makeInNOutFunctionDesc({
      name: "math/euler/separate",
      label: "Separate Eueler",
      category: "Eueler Math" as any,
      in: [{ v: "euler" }],
      out: [{ x: "float" }, { y: "float" }, { z: "float" }],
      exec: (v: Euler) => {
        return { x: v.x, y: v.y, z: v.z };
      }
    }),
    "math/euler/toVec3": makeInNOutFunctionDesc({
      name: "math/euler/toVec3",
      label: "to Vec3",
      category: "Eueler Math" as any,
      in: [{ v: "euler" }],
      out: [{ v: "vec3" }],
      exec: (v: Euler) => {
        return { v: new Vector3().setFromEuler(v) };
      }
    }),
    ...Vector3Nodes,
    ...makeObjectPropertyFlowNode("visible", "boolean"),
    ...makeObjectPropertyFlowNode("position", "vec3"),
    ...makeObjectPropertyFlowNode("rotation", "euler"),
    ...makeObjectPropertyFlowNode("scale", "vec3")
  },
  values: {
    ...coreValues,
    ...Vector3Value,
    entity: EntityValue,
    euler: EurlerValue
  }
} as IRegistry;

const skipExport = [
  "customEvent/onTriggered",
  "customEvent/trigger",
  "math/easing",
  "debug/expectTrue",
  "flow/sequence",
  "flow/waitAll"
];
const nodeSpec = writeNodeSpecsToJSON({ ...registry, dependencies: {} }).filter(node => {
  return !(
    node.type.startsWith("hubs/entity/set/") ||
    node.type.startsWith("flow/switch/") ||
    skipExport.includes(node.type)
  );
});
for (const node of nodeSpec) {
  let cat = node.category as string;
  if (cat === NodeCategory.Logic && node.type.endsWith("string")) {
    cat = "String Logic";
  }
  if (node.type.startsWith("debug/")) cat = "Debug";
  if (cat === NodeCategory.None) {
    if (node.type.startsWith("math/") && node.type.endsWith("float")) cat = "Float Math";
    else if (node.type.startsWith("math/") && node.type.endsWith("boolean")) cat = "Bool Math";
    else if (node.type.startsWith("math/") && node.type.endsWith("integer")) cat = "Int Math";
    else if (node.type.startsWith("math/") && node.type.endsWith("string")) cat = "String Math";
    else if (node.type.startsWith("logic/") && node.type.endsWith("string")) cat = "String Util";
    else {
      cat = node.type.split("/")[0];
      cat = cat.charAt(0).toUpperCase() + cat.slice(1);
    }
  }
  node.category = cat as any;
  if (node.type === "math/and/boolean") node.label = "AND";
  else if (node.type === "math/or/boolean") node.label = "OR";
  else if (node.type.startsWith("math/negate")) node.label = "Negate";
  else if (node.type.startsWith("math/subtract")) node.label = "Subtract";
  else if (node.type === "hubs/entity/hasComponent") node.inputs[2].defaultValue = true;
}

console.log("registry", registry, nodeSpec);
console.log(JSON.stringify(nodeSpec, null, 2));
// const registry = createRegistry();

// registerCoreProfile(registry, logger, manualLifecycleEventEmitter);
//
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
  behaviorGraphEnterQuery(world).forEach(function (eid) {
    const obj = world.eid2obj.get(eid)!;
    const graphJson = obj.userData.behaviorGraph as GraphJSON;

    const lifecycleEmitter = new ManualLifecycleEventEmitter();
    const dependencies = makeCoreDependencies({
      lifecyleEmitter: lifecycleEmitter,
      logger
    });

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

  const collisionCheckEntiteis = new Set([
    ...entityEvents.onCollisionEnter.keys(),
    ...entityEvents.onCollisionExit.keys()
  ]);
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
        entityEvents.onCollisionExit.get(eid)!.emit(collidingEid);
      }
    });

    const collisions = physicsSystem.getCollisions(Rigidbody.bodyId[eid]) as EntityID[];
    if (collisions.length) {
      for (let i = 0; i < collisions.length; i++) {
        const bodyData = physicsSystem.bodyUuidToData.get(collisions[i]);
        const collidingEid = bodyData.object3D.eid;
        if (!collidingEntities.includes(collidingEid)) {
          collidingEntities.push(collidingEid);
          entityEvents.onCollisionEnter.get(eid)!.emit(collidingEid);
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
