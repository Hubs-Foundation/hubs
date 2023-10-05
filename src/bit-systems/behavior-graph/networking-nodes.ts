import {
  AsyncNode,
  Engine,
  IGraphApi,
  NodeCategory,
  NodeDescription,
  NodeDescription2,
  Socket,
  SocketsList,
  makeFlowNodeDefinition,
  makeFunctionNodeDefinition,
  makeInNOutFunctionDesc
} from "@oveddan-behave-graph/core";
import { definitionListToMap } from "./utils";
import { EntityID, Networked, NetworkedBehavior, NetworkedBehaviorData, Owned } from "../../bit-components";
import { HubsWorld } from "../../app";
import { entityExists, hasComponent } from "bitecs";
import { ClientID } from "../../utils/networking-types";
import { takeOwnership } from "../../utils/take-ownership";
import { takeSoftOwnership } from "../../utils/take-soft-ownership";

export class TakeSoftOwnership extends AsyncNode {
  public static Description = new NodeDescription2({
    typeName: "networking/takeSoftOwnership",
    category: "Networking",
    label: "Take Soft Ownership",
    factory: (description, graph) => new TakeSoftOwnership(description, graph)
  });

  constructor(description: NodeDescription, graph: IGraphApi) {
    super(
      description,
      graph,
      [new Socket("flow", "flow"), new Socket("entity", "entity")],
      [new Socket("flow", "success"), new Socket("flow", "error")]
    );
  }

  private callPending = false;

  triggered(engine: Engine, _triggeringSocketName: string, finished: () => void) {
    if (this.callPending) {
      return;
    }

    this.callPending = true;

    const world = this.graph.getDependency("world") as HubsWorld;
    const entity = this.readInput("entity") as EntityID;

    takeSoftOwnership(world, entity);
    setTimeout(() => {
      if (!this.callPending) return;
      this.callPending = false;
      if (entityExists(world, entity) && hasComponent(world, Owned, entity)) {
        engine.commitToNewFiber(this, "success");
      } else {
        engine.commitToNewFiber(this, "error");
      }
      finished();
    }, 1000);
  }

  dispose() {
    this.callPending = false;
  }
}

export const NetworkingNodes = definitionListToMap([
  TakeSoftOwnership.Description,
  makeFlowNodeDefinition({
    typeName: "networking/takeOwnership",
    category: "Networking" as any,
    label: "Take Ownership",
    in: () => [
      { key: "flow", valueType: "flow" },
      { key: "entity", valueType: "entity" }
    ],
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit, graph }) => {
      const entity = read("entity") as EntityID;
      const world = graph.getDependency("world") as HubsWorld;
      takeOwnership(world, entity);
      commit("flow");
    }
  }),
  makeInNOutFunctionDesc({
    name: "networking/isMine",
    label: "Is Entity Mine",
    category: "Networking" as NodeCategory,
    in: [{ entity: "entity" }],
    out: [{ result: "boolean" }],
    exec: (entity: EntityID) => {
      return hasComponent(APP.world, Owned, entity);
    }
  }),
  makeInNOutFunctionDesc({
    name: "networking/isOwner",
    label: "Is Entity Owner",
    category: "Networking" as NodeCategory,
    in: [{ player: "player" }, { entity: "entity" }],
    out: [{ result: "boolean" }],
    exec: (player: ClientID, entity: EntityID) => {
      return Networked.owner[entity] === APP.getSid(player);
    }
  }),
  makeInNOutFunctionDesc({
    name: "networking/isOwned",
    label: "Is Entity Owned",
    category: "Networking" as NodeCategory,
    in: [{ entity: "entity" }],
    out: [{ result: "boolean" }],
    exec: (entity: EntityID) => {
      return Networked.owner[entity] !== APP.getSid("reticulum");
    }
  }),
  makeInNOutFunctionDesc({
    name: "networking/getOwner",
    label: "Get Entity Owner",
    category: "Networking" as NodeCategory,
    in: [{ entity: "entity" }],
    out: [{ player: "player" }],
    exec: (entity: EntityID) => {
      const ownerSid = Networked.owner[entity];
      return APP.sid2str.get(ownerSid);
    }
  }),
  makeFlowNodeDefinition({
    typeName: "networkedVariable/set",
    category: "Components" as any,
    label: "Networked Variable Set",
    configuration: {
      prop_name: {
        valueType: "string"
      },
      prop_type: {
        valueType: "string"
      }
    },
    in: configuration => {
      const type = configuration.prop_type || "string";
      const name = configuration.prop_name || "prop";

      const sockets: SocketsList = [
        {
          key: "flow",
          valueType: "flow"
        },
        {
          key: "entity",
          valueType: "entity"
        },
        {
          key: type,
          valueType: type,
          label: name
        }
      ];

      return sockets;
    },
    initialState: undefined,
    out: { flow: "flow" },
    triggered: ({ read, commit, configuration }) => {
      const name = configuration.prop_name as string;
      const type = configuration.prop_type as string;

      const entity = read("entity") as EntityID;
      const value = read(type);
      const data = NetworkedBehaviorData.get(entity) || new Map();
      data.set(name, value);
      NetworkedBehaviorData.set(entity, data);
      NetworkedBehavior.timestamp[entity] = performance.now();

      commit("flow");
    }
  }),
  makeFunctionNodeDefinition({
    typeName: "networkedVariable/get",
    category: "Components" as any,
    label: "Get",
    configuration: {
      prop_name: {
        valueType: "string"
      },
      prop_type: {
        valueType: "string"
      }
    },
    in: () => {
      const sockets: SocketsList = [
        {
          key: "entity",
          valueType: "entity"
        }
      ];

      return sockets;
    },
    out: configuration => {
      const type = configuration.prop_type || "string";
      const name = configuration.prop_name || "prop";

      const result: SocketsList = [
        {
          key: type,
          valueType: type,
          label: name
        }
      ];

      return result;
    },
    exec: ({ read, write, configuration }) => {
      const name = configuration.prop_name as string;
      const type = configuration.prop_type || "string";

      const entity = read("entity") as EntityID;
      if (NetworkedBehaviorData.has(entity)) {
        const data = NetworkedBehaviorData.get(entity)!;
        if (data.has(name)) {
          write(type, data.get(name));
        }
      }
    }
  })
]);
