import {
  EventEmitter,
  makeEventNodeDefinition,
  makeFlowNodeDefinition,
  makeInNOutFunctionDesc,
  NodeCategory,
  ValueType
} from "@oveddan-behave-graph/core";
import { addComponent, hasComponent, IComponent } from "bitecs";
import { Box3, Box3Helper, Object3D, Vector3 } from "three";
import { CursorRaycastable, EntityID, RemoteHoverTarget, SingleActionButton } from "../../bit-components";
import * as bitComponents from "../../bit-components";
import { COLLISION_LAYERS } from "../../constants";
import { Fit, inflatePhysicsShape, Shape } from "../../inflators/physics-shape";
import { definitionListToMap } from "./utils";
import { findAncestorWithComponent } from "../../utils/bit-utils";
import { inflateRigidBody, Type } from "../../inflators/rigid-body";
import { ClientID } from "../../utils/networking-types";

export const entityEvents = {
  onInteract: new Map<EntityID, EventEmitter<EntityID>>(),
  onCollisionEnter: new Map<EntityID, EventEmitter<EntityID>>(),
  onCollisionExit: new Map<EntityID, EventEmitter<EntityID>>(),
  onPlayerCollisionEnter: new Map<EntityID, EventEmitter<ClientID>>(),
  onPlayerCollisionExit: new Map<EntityID, EventEmitter<ClientID>>()
};
type EntityEventState = {
  target?: EntityID;
  callback?: (target: EntityID) => void;
};
function makeEntityEventNode(
  event: keyof typeof entityEvents,
  outputType: "player" | "entity",
  label: string,
  hackySetup?: (target: EntityID) => void
) {
  return makeEventNodeDefinition({
    typeName: `hubs/${event}`,
    category: NodeCategory.Event,
    label,
    in: {},
    out: {
      flow: "flow",
      [outputType]: outputType
    },
    configuration: {
      target: { valueType: "entity" }
    },
    initialState: {} as EntityEventState,
    init: ({ write, commit, configuration }) => {
      const target = configuration["target"] as EntityID;
      if (!target) throw new Error(`hubs/${event} must have a target`);
      hackySetup && hackySetup(target);
      const callback = (data: any) => {
        console.log(event, data);
        write(outputType, data);
        commit("flow");
      };
      const emitter = entityEvents[event].get(target) || new EventEmitter();
      emitter.addListener(callback);
      entityEvents[event].set(target, emitter as any);
      return { target, callback };
    },
    dispose: ({ state: { callback, target } }) => {
      const emitter = entityEvents[event].get(target!)!;
      emitter.removeListener(callback as any);
      if (!emitter.listenerCount) entityEvents[event].delete(target!);
      return {};
    }
  });
}

function makeObjectPropertyFlowNode<T extends keyof Object3D>(property: T, valueType: string) {
  const typeName = `hubs/entity/set/${property}`;
  return makeFlowNodeDefinition({
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
  });
}

export const EntityValue = {
  entity: new ValueType(
    "entity",
    () => 0,
    (value: EntityID) => value,
    (value: EntityID) => value,
    (start: EntityID, end: EntityID, t: number) => (t < 0.5 ? start : end)
  )
};

function hackyColliderSetup(target: EntityID) {
  // TODO should be added in blender, hacking assuming a blender box empty with scale to adjust size
  if (!hasComponent(APP.world, bitComponents.Rigidbody, target)) {
    const obj = APP.world.eid2obj.get(target)!;
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
      halfExtents: obj.scale.toArray()
    });
    obj.scale.multiplyScalar(2);
    obj.matrixNeedsUpdate = true;
    obj.add(new Box3Helper(new Box3(new Vector3(-0.5, -0.5, -0.5), new Vector3(0.5, 0.5, 0.5))));
  }
}

export const EntityNodes = definitionListToMap([
  makeEntityEventNode("onInteract", "entity", "On Interact", function (target) {
    // TODO should be added in blender
    addComponent(APP.world, SingleActionButton, target);
    addComponent(APP.world, CursorRaycastable, target);
    addComponent(APP.world, RemoteHoverTarget, target);
  }),

  makeEntityEventNode("onCollisionEnter", "entity", "On Collision Enter", hackyColliderSetup),
  makeEntityEventNode("onCollisionExit", "entity", "On Collision Exit"),
  makeEntityEventNode("onPlayerCollisionEnter", "player", "On Player Collision Enter", hackyColliderSetup),
  makeEntityEventNode("onPlayerCollisionExit", "player", "On Player Collision Exit"),

  makeInNOutFunctionDesc({
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
  makeInNOutFunctionDesc({
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
  makeInNOutFunctionDesc({
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
        // TODO this is largely so that variables work since they are set using =. We can add support for .copy()-able things
        position: obj.position.clone(),
        rotation: obj.rotation.clone(),
        scale: obj.scale.clone()
      };
    }
  }),
  makeInNOutFunctionDesc({
    name: "hubs/entity/equal",
    label: "=",
    category: "Entity" as any,
    in: ["entity", "entity"],
    out: [{ result: "boolean" }],
    exec: (a: EntityID, b: EntityID) => {
      return a === b;
    }
  }),
  makeObjectPropertyFlowNode("visible", "boolean"),
  makeObjectPropertyFlowNode("position", "vec3"),
  makeObjectPropertyFlowNode("rotation", "euler"),
  makeObjectPropertyFlowNode("scale", "vec3")
]);
