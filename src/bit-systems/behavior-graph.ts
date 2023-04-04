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
  ValueType
} from "@oveddan-behave-graph/core";
import { addComponent, defineQuery, enterQuery, exitQuery, hasComponent, IComponent } from "bitecs";
import { BoxGeometry, Mesh, MeshStandardMaterial, Object3D, Vector3 } from "three";
import { HubsWorld } from "../app";
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
import { findComponentsInNearestAncestor } from "../utils/scene-graph";
import * as bitComponents from "../bit-components";

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
      category: NodeCategory.Action,
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

type Vec3JSON = { x: number; y: number; z: number };
export const Vector3Value = new ValueType(
  "vec3",
  () => new Vector3(),
  (value: Vector3 | Vec3JSON) => (value instanceof Vector3 ? value : new Vector3(value.x, value.y, value.z)),
  (value: Vector3) => ({ x: value.x, y: value.y, z: value.z }),
  (start: Vector3, end: Vector3, t: number) => start.lerp(end, t)
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
      in: [{ entity: "entity" }],
      out: "string",
      exec: (entity: EntityID) => {
        const obj = APP.world.eid2obj.get(entity)!;
        return `Entity ${obj.name}`;
      }
    }),
    "hubs/entity/hasComponent": makeInNOutFunctionDesc({
      name: "hubs/entity/hasComponent",
      label: "Entity toString",
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
      in: [{ entity: "entity" }],
      out: [{ entity: "entity" }, { name: "string" }, { visible: "boolean" }, { position: "vec3" }],
      exec: (eid: EntityID) => {
        const obj = APP.world.eid2obj.get(eid)!;
        return { entity: eid, name: obj.name, visible: obj.visible, position: obj.position };
      }
    }),
    "math/vec3/combine": makeInNOutFunctionDesc({
      name: "math/vec3/combine",
      label: "Combine XYZ",
      in: [{ x: "float" }, { y: "float" }, { z: "float" }],
      out: [{ v: "vec3" }],
      exec: (x: number, y: number, z: number) => {
        return { v: new Vector3(x, y, z) };
      }
    }),
    "math/vec3/separate": makeInNOutFunctionDesc({
      name: "math/vec3/separate",
      label: "Separate Vec3",
      in: [{ v: "vec3" }],
      out: [{ x: "float" }, { y: "float" }, { z: "float" }],
      exec: (v: Vector3) => {
        return { x: v.x, y: v.y, z: v.z };
      }
    }),
    ...makeObjectPropertyFlowNode("visible", "boolean"),
    ...makeObjectPropertyFlowNode("position", "vec3")
  },
  values: {
    ...coreValues,
    entity: EntityValue,
    vec3: Vector3Value
  }
} as IRegistry;
console.log("registry", registry);
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
    console.log(validateRegistry(registry), validateGraph(graph), graph);

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
